---
layout: project
title:  "GPU Rope System in Unreal Engine 5.2"
date: 2024-03-15 12:40:30 -0700
tags: unreal shaders procedural math physics
thumbnail: /assets/img/rope/thumbnail.png
intro: A procedurally-generated rope system in UE5 with realistic dynamics, driven by a custom-built physics engine supporting tension constraints
project: true
---

<script>
window.MathJax = {
  options: {
    enableMenu: false
  },
  tex: {
    inlineMath: [['$', '$'], ['\\(', '\\)']] // Adds $...$ as an accepted in-line math delimiter
  },
  svg: {
    scale: 1,
    minScaleAdjust: 50,
    matchFontHeight: true
  }
};
</script>
<style>
.MathJax {
  max-width: 100%;
  overflow-x: hidden;
}
</style>

## Introduction

In this blog post, I will share how I implemented a dynamic, physically-based, procedural rope system in Unreal Engine 5.2. Using this system, we can build complex rope systems and pulleys. This tool set introduces rope physics into gameplay without relying on complex physics constraint chains or reconciling unpredictable FX simulations with engine physics.

This system is comprised of three key components:

1. Procedurally generated, high-performance ropes constructed on the GPU
2. Physics solver to drive rope tension constraints, including torque and inertia
3. A rope system to link multiple ropes together and form rope chains

{% include lazyload.html img="/assets/img/rope/rope_test_1.gif" caption="
A single rope segment showing start and end points movable in 3D space, with the rope automatically forming a mathematically correct catenary curve." %}

{% include lazyload.html img="/assets/img/rope/rope_system_2.gif" caption="A demonstration of a rope system with multiple segments connected by pulleys; pulling one rope through the system adjusts all ropes' textures by propagating offset. The system is configured to a generator-style setup where one end can add length to the entire rope system as necessary." %}

{% include lazyload.html img="/assets/img/rope/better_torque_1.gif" caption="Custom physics solver integrating torque and tension constraints, allowing mesh objects to move accurately based on rope influence, showcasing dynamic interaction between ropes and objects. Note the rotation of the pulley as the rope moves." %}

{% include lazyload.html img="/assets/img/rope/pulley_2.gif" caption="An alternative rope system where ropes are connected without length generation; a static blue cube lifts a red cube via a single rope and pulley mechanism." %}

{% include lazyload.html img="/assets/img/rope/pulley_1.gif" caption="A more complex pulley system where moving intermediary pulleys affects the segments throughout the system." %}


## Prototyping a Procedural Rope

The implementation of our rope system depends on how we expect our ropes to behave during gameplay. A rope that can contort into complex knots should have a very different implementation than a rope which is expected to remain straight and/or static (which is essentially a static mesh actor).

For this project, I decided to create a balanced system which allows designers to define the start and end points of the rope, and procedurally generate a rope mesh. This mesh will then be deformed by high-performance materials on the GPU to reflect the impact of weight on the rope's curvature. Additional attributes to set the rope's length, effect on physics-enabled objects, and taut threshold provide designers more control to tune behavior for different situations. Most importantly, the rope mesh will rebuild itself if the start or end points move.

### Simple Rope Dynamics

A rope is essentially a long cylinder of variable **length** and **radius**, bent into an arbitrary shape. Most ropes can be represented by a partial differential equation or other non-linear system, translating to a curve in 3D space. However, for our rope system, we only care about the start and end positions of the rope. To achieve this, we can trivially designate two points in 3D world space to represent the **start (S)** and **end (E)** positions of our rope, then rely on vertex deformation to manipulate a procedurally-generated cylinder mesh.

If a rope is **taut**, then the rope length is equal to the distance between the start and end positions. In this simple case, the rope shape is a static cylinder and has no visible deformation at all; it is transformed and positioned such that each end of the cylinder is found at **S** and **E**. Likewise, a rope with **slack** or **sag** has a length greater than the distance between the start and end positions.

The shape of a rope with slack forms a unique curve based on the rope's own weight. This curve is known as a [catenary curve](https://en.wikipedia.org/wiki/Catenary#), a well-studied concept in mathematics.

{% include lazyload.html img="/assets/img/rope/catenary_examples.png" width="80" caption="The catenary is found in both modern engineering and nature: bridge cables, telephone wires, and even spider webs are some examples of real-life catenaries." %}

To simplify our problem, let's consider a case where a rope lies flat on the ground. This rope is not particularly interesting; assuming the rope is straight, this object is just a cylinder (as previously stated). However, if our rope's length is less than the distance between the start and end points, we've met the conditions to form a catenary.

Let's define the rope's **length** as the total length of the rope, regardless of its shape. A rope's **distance** is the true distance between the start and end points in 3D space.

To summarize:

1. If **length** is greater than **distance**, we form a catenary, simulating rope sag.
2. If **length** is equal to **distance**, we form a cylinder from the start to end points.
3. If **length** is less than **distance**, we stretch our cylinder from the start to end, simulating a rope being stretched beyond its natural resting length; there is no sag as there is no slack in the rope.

If we can solve the equation for a catenary curve intersecting two points, we can build a system to procedurally deform a rope mesh from its static form into the shape we need. By abstracting the problem into a mathematical function, we can reframe the initial conditions of the rope to match our model, then deform vertices with a high-level of consistency.

### The Math Behind Ropes

Despite how it looks, a catenary is *not* a parabola -- it is based on hyberbolics. Given two points on a curve, we need to find a function $f(x) = y$ that gives us the correct $y$ value translation for each vertex on our flat, horizontal rope mesh.

First, we can formally define the curve in Cartesian coordinates using the equation: 

$$y = \frac{a}{2}(e^{\frac{x}{a}}+e^{-\frac{x}{a}}) = a\cosh(\frac{x}{a})$$

where $a$ is the distance to the lowest point above the x axis. For the sake of simplicity, we normalize our equation such that $x$ is a value within the range of $ [0,1] $. To find the value of $y$, we must first determine a method to generate the correct value for $a$ given our start and end coordinates of the rope.

{% include lazyload.html img="/assets/img/rope/catenary_graph.png" width="100" caption="Here, $L$ is the length of the rope and $H$ is the vertical distance between the start and end points. Both $L$ and $H$ have been normalized based on the horizontal distance, which is now equal to 1. We are looking for a function $f(x, H, L)$ which maps to the vertical translation necessary to form this curve from the line $y=-H$ (or $y=H$ if the end point is higher than the start point)." %}

Between two values of $x$ we define $H$ as the difference in height between the two points, and $L$ as the length of the curve. These can be trivially inferred from our original hyperbolic equation:

$$H=a\cosh(\frac{x_{2}}{a})-a\cosh(\frac{x_{1}}{a})$$

$$L=a\sinh(\frac{x_{2}}{a})-a\sinh(\frac{x_{1}}{a})$$

By using the known hyperbolic identity

$$\cosh^{2}(x)-\sinh^{2}(x)=1$$

we can find a simplified form to solve for $a$:

$$L^{2}-H^{2}=4a^{2}\sinh^{2}(\frac{h}{2a})$$

Applying a square root to both sides, we can simplify our equation to:

$$\sqrt{L^{2}-H^{2}}=2a\sinh(\frac{h}{2a})$$

where $h$ is the horizontal distance between the two points, which we have normalized to 1.

Because all other variables have real values, we can solve for $a$ to complete our original function to determine $y$. Unfortunately, this equation is transcendental due to complications with $\sinh(x)/x$, and has no analytical solution.

Instead, we utilize a numerical solution to approximate the value of $a$, which should be sufficient for our vertex deformation. We use an iterative method based on the [Newton–Raphson method](https://en.wikipedia.org/wiki/Newton%27s_method), which requires a derivative of our hyperbolic function:

$$z_{n+1}=z_{n}-\frac{f(x_{n})}{f'(x_{n})}$$

We can replace $a=1/(2z)$ to simplify our math, and treat $h=1$ as previously mentioned. Our equation now becomes

$$z_{n+1}=z_{n}-\frac{\sqrt{L^{2}-H^{2}} - \frac{\sinh(z_{n})}{z_{n}} }{\frac{\sinh(z_{n})}{z_{n}^{2}}-\frac{\cosh(z_{n})}{z_{n}}}$$

By using the quotient rule, finding the derivative of our zero function is not too difficult. Remembering our substitution, we can easily run our method through $n$ number of iterations to determine a value for $a$.

{% include lazyload.html img="/assets/img/rope/a-values.svg" width="60" caption="This diagram illustrates how the value of $a$ impacts the sag on the rope between two points. Note how $a$ reflects other parameters of the rope, including its length." %}

At this point, we have enough information to determine the value of $y$ if $f(x, H, L) = y$. However, the current math assumes the position of our curve is about the x axis, when the curve is equally divided by $x=0$. We must add a new variables to represent our x and y translations, which will adjust the position of the curve according to our start and end coordinates.

$$y = a\cosh(\frac{x}{a})$$

becomes

$$y = a\cosh(\frac{x-x_{0}}{a})+y_{0}$$

where $x_{0}$ and $y_{0}$ is the amount needed to translate our curve to the correct position. This can be calculated using our values of $a$, which is now a known constant from numerical approximation.

Ultimately, what we are looking for is a catenary curve that intersects with $(0,0)$ and $(1,H)$. We can plug in values from our original forms of the catenary to solve a system of equations:

At (0,0):

$$0 = a\cosh(\frac{0-x_{0}}{a})+y_{0} = a\cosh(\frac{-x_{0}}{a})+y_{0}$$

$$y_{0} = -a\cosh(\frac{-x_{0}}{a})$$

At (1, H):

$$H = a\cosh(\frac{1-x_{0}}{a})-a\cosh(\frac{-x_{0}}{a})$$

We can simplify these equations using hyperbolic identities and properties of logs, to get:

$$H = 2a\sinh{\frac{1}{2a}}\sinh(\frac{1}{2a}-\frac{x_{0}}{a})$$

Recall that $2a\sinh{\frac{1}{2a}}$ is actually $\sqrt{L^{2}-H^{2}}$ when $x=1$ and $y=H$. Subtituting and simplifying our equation to solve for $x_{0}$, we get a much nicer form in nice terms of $L$, $H$, and $a$:

$$x_{0} = 1-\frac{a\ln{\frac{L-H}{L+H}}}{2}$$

We can do a similar process for $y_{0}$, but we must account for symmetry. Because we want the highest point between two points to serve as the origin, we can use the absolute value of $H$ when comparing two different heights. This makes intuitive sense as we are always translating our verticies in the negative y direction to form the shape of the catenary.

$$y_{0} = -|\frac{H}{2}|-\frac{L\cosh{z}}{2\sinh{z}}$$

We now know enough information to translate each vertex on our procedurally generated, cylindrical mesh to form a catenary curve.

## Implementing the Rope Catenary Material

The curve formed by the rope will be dynamic and procedural, as will the geometry of our rope mesh -- if the start and end points move during gameplay, the rope should adjust itself accordingly. This means we will need to render our procedural rope every tick our start and end positions are modified. The math described in the previous section is expensive, as hyperbolics are not particularly efficient.

To maintain performance, we can deform our mesh vertices using materials. While materials cannot be used for everything, our deformation is largely based on mathematics, so writing our math using HLSL will be fairly reliable. In addition, using materials will run these expensive operations on the GPU.

Unreal Engine 5.2 supports vertex deformation with [World Position Offset, abbreviated as WPO](https://dev.epicgames.com/documentation/en-us/unreal-engine/material-inputs-in-unreal-engine#worldpositionoffset). WPO is very powerful, but with  power comes great responsibility. First, we will need to ensure our input mesh is correct (after all, garbage in, garbage out). Second, WPO is not easy to debug. Therefore, taking this process one step at a time will ensure we aren't throwing pages of HLSL at our mesh. WPO accepts a single 3-float vector which results in translation for each vertex on the mesh that the material is applied to. We can incrementally add to this vector for each step during RnD.

{% include lazyload.html img="/assets/img/rope/vertex_deformation.png" width="100" caption="Our rope begins as a flat cylinder between the start and end points of the rope, positioned such that the higher of the two is treated as the start point. This point becomes the origin of a 2D catenary curve. Using the formula generated in the previous section, we calculate the required deformation to pull the vertices down to fit a catenary curve. Recall that $x_{0}$ is the horizontal distance to shift the curve away from the center of the axis, and $H$ is the vertical distance between the two points." %}

To create our rope shape, we follow this strategy:

1. Define two points in world space: a **start (S)** and **end (E)** point.
2. Choose the point with the greater z value, or the point that is higher in 3D space. Treat this as the **origin**.
3. Build a procedural cylinder from $S$ to $E$, flat on the horizontal plane of the origin.
4. Reframe the problem in 2 dimensions. Treat the origin as the starting point of our function $f(x, H, L)$ such that the curve exists on the plane defined by $\vec{SE}$.
5. Calculate the required translation for $z$ based on the output of $f(x, H, L)$ and add this to the WPO. This will be a negative value, resulting in vertices translating down to fit the shape of the curve.

### Creating the Rope Shape - Ribbons

First, let's simplify the problem as a [goemetric ribbon](https://en.wikipedia.org/wiki/Ribbon_(mathematics)) instead of a cylinder. Why? As we will see later, deforming a cylinder into the shape of a catenary using naive math comes with strings attached.

A ribbon in 3 dimensions is simply a plane with a normal direction and arbitrary width. This allows us to get as close as possible to our curve with as little volumetric distortion as possible. For the sake of brevity, I won't review how I created this particular mesh, since the math to create a ribbon is fairly straight forward. Here's some variables we will use, which will carry on to our cylindrical shape:

- **Width**: The width of our ribbon.
- **Length**: The total length of our ribbon/rope.
- **Section Count**: The number of cross sections of the ribbon; basically, the number of segments in the ribbon.

We are ready to create our rope actor, called *BP_Rope*. It will use Unreal Engine 5's built-in [Procedural Mesh component](https://docs.unrealengine.com/4.27/en-US/BlueprintAPI/Components/ProceduralMesh/) to manually build the rope's mesh by defining individual vertices and tris. We also initialize a dynamic material instance on our new mesh, and assign a custom material, *M_Rope*.

{% include lazyload.html img="/assets/img/rope/catenary_material.png" caption="A subset of the <i>M_Rope</i> material graph to translate vertices into a catenary curve. A custom node is used to reduce bloat when approximating $a$ and $x_{0}$." %}

By exposing our start and end position variables on the actor, we can enable 3D gizmos to move our values around and play with our ribbon in real-time. 

{% include lazyload.html img="/assets/img/rope/rope_demo_1.gif" width="100" caption="A simple ribbon matching the shape of a catenary, updating whenever the start and end points reposition. Recall that when a rope's length is less than distance, we stretch our rope to match distance." %}

Our naive implementation seems to work well. We can move our start and end points, and our rope shape is driven by our material's WPO pin.

However, there is an obvious issue with our code; $f(x, H, L)$ requires numerical approximation. This error is manifests when we move our start and end positions close together.

{% include lazyload.html img="/assets/img/rope/rope_demo_2.gif" width="100" caption="Numerical approximations for $f(x, H, L)$ results in some error when moving points too close to each other on the horizontal axis. Basically, our curve can't figure out how to resolve the distance given the rope's length, and creates a hyperbola to infinity. Modifying the length of the rope demonstrates it's impact on the shape of the curve." %}

In fact, this approximation error occurs when there's a specific ratio between the horizontal distance between the two points and the total length of the rope. This mainly occurs on vertical ropes which hang from one point on the z axis to a lower point, but have essentially the same x/y values. For the sake of simplicity, we can avoid this issue by removing all deformation from $f(x, H, L)$ when this case is met, and rebuild our rope as if it is being stretched between the two points.

At this point, we have proved we can accurately deform a mesh using our rope material.

### Creating the Rope Shape - Cylinders

While this is great, we don't want ribbons; we wan't proper ropes! Luckily, a cylinder is essentially a rolled-up ribbon. To achieve geometric volume, we'll need to modify our procedural mesh component. Two variables are added to our rope actor:

- **Radius**: Replacing **Width** from the ribbon, this is the radius of the clylinder. You can also think of the radius as the distance that each vertex is translated from the center of the rope's curve in the direction of the surface normal. This will be important later.
- **Divisions**: The number of length-wise divisions on the cylinder. Adding more divisions will result in a more "circular" cylinder, while less divisions will make it more blocky.

The algorithm to build a cylinder is slightly more complicated. The primary operation involves dividing $2\pi$ radians (360 degrees) by our division count, rotating a normal vector by that amount, then pushing out a vertex from the center of the curve path using our radius value. Easy enough!

{% include lazyload.html img="/assets/img/rope/cylinder_blueprint_1.png" caption="Subset of the BP_Rope Blueprint to calculate the vertices and UVs for a rope." %}

{% include lazyload.html img="/assets/img/rope/material_parameter.png" caption="Material parameters can be passed to our material. Note that vertex information can be accessed from the material without passing them directly." %}

We now have the correct shape for our rope. But, when we try to apply our existing rope material to our new mesh, we get... complete garbage!

{% include lazyload.html img="/assets/img/rope/garbage_1.png" caption="Something doesn't seem right." %}

## Distortion and Corrections

There's a few issues with this strategy. First, our naive case was based on a ribbon, where all vertices inherently exist *on* the curve. Because we translate our vertices some distance away *from* the curve to form the cylinder, the values for $x$ and $x_{0}$ don't align properly.

Second, our material only translates vertices in the negative $z$ direction (downwards) to form the catenary curve. It won't rotate the cross sections of the cylinder, which is necessary to ensure the shape of the rope remains a volume. The easiest way to illustrate why this is necessary is to imagine a hanging rope. In this case, the cross sections of the cylinder should be rotated 90 degrees. Otherwise, our rope will have no volume at all.

Luckily, we don't need to throw anything away, as WPO is additive. Once we calculate the vectors to correct for these distortions, we can add it to our existing vector pinned to WPO.

### Pushing out Normals

To fix the first case, we'll need all of our vertices to be positioned on the curve for the catenary functions to work properly. We can take advantage of the fact that arbitrary vectors can be passed as vertex normals to our material using the procedural mesh component options.

First, we build our rope mesh as if the radius is equal to 0, ensuring all points are on the curve. Next, translate the vertices down using the catenary function. Finally, we pass the true radius using material instance parameters to the material, multiplying that by the normal vector to get the proper translation for each vertex, "pushing out" the rope's volume from the center.

### Rotating the Rope Cross Sections

{% include lazyload.html img="/assets/img/rope/gradient_1.png" caption="The gradient and normal to the gradient are used to rotate cross sections (red) to bend the cylinder according to the curve." %}

The second issue is more difficult to fix. We need to ensure that the cross sections of the rope are correctly oriented based on the direction of the normal of the catenary curve at that vertex's location on the curve. This means we will need the normal to the curve for each vertex, which is derived from the gradient of $f(x, H, L)$ from earlier. Luckily, hyberbolic derivatives are much less scary than integrals (spoiler alert: we will need those later, too):

$$ f'(x, H, L) = \sinh{(\frac{x-x_{0}}{a})} = m_{gradient} $$

Note that our $y_{0}$ value has been eliminated, and all the other values are already known constants given $x$, $H$, and $L$. This value can be treated as the slope to a linear function:

$$ y = m_{gradient}*x+b $$

As a unit vector, this is simply:

$$ \vec{g} = \begin{pmatrix} 1 \\ m \end{pmatrix} $$

Finding the normal to the gradient is as simple as taking the cross product with the  vector that defines the plane that the curve exists on (basically, the plane vector that contains both the start and end points). Or, more simply, we take the inverse of the gradient unit vector.

$$ \vec{n}_{gradient} = \begin{pmatrix} -m \\ 1 \end{pmatrix} $$

At this point, we *could* multiply $\vec{n_{gradient}}$ by our radius to get the correct distance to translate a vertex to match the catenary normal. However, this will only work for the vertex whose vertex normal is equal to $(0, 0, -1)$. From here, there's several strategies to correctly translate the math for possible location for each vertex, but I opted for a simpler strategy.

What we really need to do is find the angle between this particular vector and the down vector. Why? Since each of our cross sections form a polygon that stands straight up, the angle between the down vector and the curve's normal will give us the amount each vertex must rotate.

$$ \theta_{correction} = \cos^{-1}(\frac{\vec{n}_{gradient}}{\vec{v}_{down}}) $$

One of my favorite algorithms is [Rodrigues's rotation formula](https://en.wikipedia.org/wiki/Rodrigues%27_rotation_formula), which allows you to rotate a vector around any arbitrary axis. The formula is given by:

$$ \vec{v}_{\text{rot}} = \vec{v} \cos \theta + (\vec{k} \times \vec{v}) \sin \theta + \vec{k} (\vec{k} \cdot \vec{v}) (1 - \cos \theta) $$

$v$ is simply the vector we want to rotate, which is also the vertex that has been pushed out using the vertex normal. $\theta$ is the angle you wish to rotate $v$ by. $k$ is the unit vector representing the axis, which we can get by calculating the following:

$$ k = \vec{SE} \times \begin{pmatrix} 0 \\ 0 \\ 1 \end{pmatrix}$$

where $S$ is the starting position vector and $E$ is the ending position vector.

{% include lazyload.html img="/assets/img/rope/k_1.png" caption="Calculation for $k$, the rotation axis." %}

{% include lazyload.html img="/assets/img/rope/rod_1.png" caption="Rodrigues's rotation formula saved as a material function expression. Note: There are existing functions to rotate vectors, but they didn't seem to work the same nor as effectively as Rodrigues's." %}

{% include lazyload.html img="/assets/img/rope/grad_1.png" caption="Calculation for the gradient normal vector for each vertex." %}

In the case where the rope is straight, either due to approximation errors or when the rope's length is less than the rope's distance, we need to create a simplified case since our catenary values will be wrong. For this, we simply rotate cross sections until they align with the rope's distance vector ($\vec{SE}$). 

{% include lazyload.html img="/assets/img/rope/simple_1.png" caption="Simplified rotation for each cross section to align with the vector $\vec{SE}$." %}

Finally, we add all of our correction vectors to the existing catenary translation to achieve the final rope shape.

$$ \vec{v}_{correction} = \vec{v}_{catenary} + \vec{v}_{normal} + \vec{v}_{rotation} $$

{% include lazyload.html img="/assets/img/rope/compare_1.png" caption="Left: The original rope cylinder without any vertex deformation; Right: Final rope mesh." %}

Note: When using the absolute world position of vertices to calculate the normalized value for $x$, we need to be sure that the vertex is using the coordinates prior to WPO translation. It's a bit hidden, but an option the Absolute World Position node allows us to exclude WPO translations.

{% include lazyload.html img="/assets/img/rope/x_calculation_normal_vertex.png" caption="Calculating the value of $x$ for any given vertex on the rope mesh." %}

## Correcting for UV Stretching

When we translate the vertices of our cylinder using WPO, the UVs stretch because the rope's new shape doesn't align with the original texture scaling.

{% include lazyload.html img="/assets/img/rope/texture_stretching.png" caption="Vertices are grouped closer together on areas where the slope is greater (near the ends) resulting in squished textures, while vertices where the slope is equal to zero have stretched textures." %}

This is due to some assumptions we made when constructing the procedural mesh vertices. Each vertex was set to be horizontally distributed an equal distance apart. When the mesh is unwrapped and the verities are mapped onto UV coordinates, each section is given $i/n$ units of the UV's $x$ axis, where $i$ is the index of the cross section.

{% include lazyload.html img="/assets/img/rope/uv_diagram.jpg" width="100" caption="The red lines represent cross sections along the $x$ axis of the rope's texture. Top: A basic, linear rope without catenary WPO applied. Bottom: A catenary-curve rope." %}

To fix this, we need to reposition the UVs for each vertex to account for translations from WPO.

The $x$ value for each vertex is no longer linearly associated with the length of the curve from $0$ to $x$. We wil need to determine a function $f(x) = L_{vertex}$ where $x$ is the horizontal distance, and $L_{vertex}$ is the length of the curve to that vertex. Then, calculating the $x$ value for the UV will be as simple as:

$$ x_{uv} = \frac{L_{vertex}}{L_{total}} $$


### Calculating Arc Length

Our strategy will involve taking the arc length of the curve to determine how far along each vertex is. This will give us the most accurate value for the UV. For a planar curve defined by the equation $f(x)=y$ where $f$ is continuously differentiable, the arc length between two points is:

$$ L_{vertex} = \int_{a}^{b} \sqrt{1 + \left( \frac{dy}{dx} \right)^2} \, dx $$

where $a$ is 0 (as our curve begins at $x=0$) and $b$ is $x_{vertex}$.

Earlier, the derivative of the curve was calculated for cross section rotation. We reuse the same form here:

$$ \frac{dy}{dx} = \sinh{(\frac{x-x_{0}}{a})} $$

Plugging in values, and solving our (very ugly) integral, we get:

$$ L_{vertex} = \int_{a}^{b} \sqrt{1 + \left( \sinh{(\frac{x-x_{0}}{a})} \right)^2} \, dx $$

$$ L_{vertex} = \frac{a\sinh({\frac{2(x-x_{0})}{a}})\sqrt{\sinh^{2}(\frac{x-x_{0}}{a}) + 1}}{\cosh({\frac{2(x-x_{0})}{a}}) + 1} $$

Dividing this value by the total length of the rope, we get the correct UV $x$ value for each vertex.

{% include lazyload.html img="/assets/img/rope/arc_length_1.png" caption="Material graph to calculate the value for $L_{vertex}$. A custom node was used for the integral calculation." %}

Because these calculations rely on our error-prone $a$ and $x_{0}$ approximations, we have a fallback to set each vertex to the original UV coordinate, as the rope becomes linear in the errored case (as explained above).

{% include lazyload.html img="/assets/img/rope/uv_material_1.png" caption="Material graph for UV calculation." %}

We use this value to generate appropriate UV coordinates. We pass our distance traveled for our rope texture into the $y$ axis pin, which is how our texture is oriented in practice.

### Final Material

Combining everything together, we create a material to deform procedural ropes into a catenary with correct textures and accurate UVs.

{% include lazyload.html img="/assets/img/rope/final_material.png" caption="Final  M_Rope material for the BP_Rope procedural rope mesh." %}

## Engineering a Custom Physics Constraint Solver

In the discipline of technical art, a lot of attention is placed on how visual systems intersect with gameplay. While significant progress was made in replicating the dynamic shape of a rope mesh, we also care about the context of the rope within the game world. For ropes in static environments (such as phone lines and cables), we can stop here.

However, ropes are rarely static. Functionally, ropes are a tool used for tension. We use ropes to rig ships, to lift heavy equipment, and to strap together objects. Therefore, we need to consider that the rope may have real influence over other objects in the world, and react to their positions accordingly.

While our rope will rebuild itself to match the start and end points as they move in the world, the rope itself may have influence on other objects. Some examples include:

- **Rope tension**: Pulling a rope should pull the object that is connected to it. A taut rope should exhibit tension forces.
- **Torque**: An object attatched to a rope should rotate according to how the rope is pulled.

### Initial Attempts at Rope Constraints

At first, I considered using UE5's [Physics Constraint system](https://dev.epicgames.com/documentation/en-us/unreal-engine/physics-constraints-in-unreal-engine?application_version=5.2), which is popular among developers to create constraints for different objects. The system is fairly intuitive and doesn't shy away from features. In fact, a popular method to create physically accurate ropes involves connecting very small, static rope segments with physics constraint components.

However, there's several limitations to the system. First, there's no real support for objects of variable length. While it's possible to adjust linear and angular ranges, those variables doesn't work for our uniquely procedural rope mesh, which has no static size.

{% include lazyload.html img="/assets/img/rope/bad_constraints_1.gif" caption="Physics constraints are good for creating relationships between different physics-enabled objects, but not emulating tension of the constraint itself. In this example, the physics constraint settings fall short when ropes become taut." %}

Second, there's no support for tension or torque forces. While you can influence an object to move using constraints on another object, in practice, this isn't any different than rig constraints. The benefit of using Physics Constraints is that it works with the default UE5 physics system, and can account for global systems like gravity and collision.

Finally, an object can only have one constraint influence at any given time. This is a deal-breaker, since we need a physics system where multiple ropes can pull an object, and from the object's perspective, account for all incoming torque and tension forces.

### Components to a Custom Physics Engine

I ultimately decided to implement my own physics engine to fix these issues. I would have preferred a lighter solution, but I wanted to experiment with the idea of modifying physics parameters in a bespoke way that default UE 5 engine physics parameters couldn't support. For example, I wanted the "taut-ness" of the rope to influence torque and rotation.

When developing this system, I chose to avoid implementing support for collision. I never imagined ropes to have built-in collision, as this system is primarily meant as a visual system rather than a gameplay component. We can still have ropes move objects, but ropes need not be responsible for any impact to gameplay. For example, we can have pulleys in a ship's rigging move around dynamically, but the pulleys themselves should serve no purpose for the player other than being eye candy. Ultimately, I decided to call my limited "physics engine" a "rope constraint solver" to more accurately reflect the scope of the features.

This solver is made up of three components:

1. **Gravity Forces** (Global constraints)
2. **Rope Forces** (Linear constraints)
3. **Torque** (Rotational constraints)

These three components can be translated into motion using Euler's method, which is a popular way to implement simple physics engines. Euler's method relies on partial differential equations to drive changes to a system as the state is modified after each tick, much like a state machine. Since velocity -- and ultimately translation -- can be derived from forces, we can think about this problem using pure physics!

For the sake of brevity, I won't explain how classical mechanics work. Instead, I will outline some basic physics as they apply to my rope system.

### Defining Connection Points

To connect our ropes, I used scene locators on our physics objects to specify rope attachment points. We will use a series of helper functions to retrieve our rope data and adjust the location of our objects.

{% include lazyload.html img="/assets/img/rope/attatchment_points.png" width="80" caption="Rope attachment points for the pulley. This simple pulley mesh was modeled and textured by me." %}

### Rope Forces and Linear Constraints

The physics of a rope is a common topic for high school physics students. The basic idea is that a rope exerts a force of tension to objects that pull on the rope. When the force of tension is equal to the force that is pulling on the rope, the system becomes static. This applies for any system with multiple forces; if the total sum of those forces is equal to 0, then there's no movement in the system. Therefore, to calculate how objects will move based on the ropes attached to them, we need to consider the sum of all forces on the rope.

All objects have a constant force applied to them called the gravitational force, $F_{gravity}$. This is applied directly to the object in the downwards direction at all times.

A tension force, $F_{tension}$, is applied when 1) the rope is taut, and 2) there is another force acting on the rope, which is causing it to be taut. Therefore, a rope will not actually have any tension force unless these conditions are true. This makes sense, as a falling object that is connected to a rope will only stop moving when it pulls the rope taut, and reaches the full extent of the rope's length. This is our **linear constraint**.

If there are $n$ ropes pulling on an object, we essentially have:

$$ \sum \vec{F} = \sum_{i=1}^{n} \vec{F}_{\text{tension}, i} + \vec{F}_{\text{gravity}} $$

We can represent the difference in time between each tick as $\Delta t$. Then, we determine our final displacement using equations derived from Newton's law, $F=ma$.

$$ a = \frac{F}{m} $$

$$ \Delta v = a \times \Delta t $$

$$ \Delta x = v_i \times \Delta t + \frac{1}{2} \times a \times (\Delta t)^2 $$

$$ x_f = x_i + \Delta x $$

Implementing this system is fairly straight forward since these equations are well-known. Once we get $x_{f}$, we can calculate the object's new position after each tick. When a connected rope becomes taut, we send a signal to our object to remove all velocity equivalent to the amount exerted by the vector of the tension force.

{% include lazyload.html img="/assets/img/rope/movement_forces.png" caption="Subset of a new BP_StylizedPhysicsSolver Blueprint to calculate incoming forces that effect velocity and position." %}

Note: Running a physics engine per gameplay tick, rather than on a persistent clock, poses the risk of system instability. If gameplay freezes for any reason, ticks can accumulate, potentially resulting in sudden and massive displacements. Funny enough, this is how speedrunners are able to do "super jumps"; they artificially freeze their game at the right time to build up momentum every tick without the objects needing to move to resolve the velocity.

### Torque and Angular Constraints

The implementation above only covers motion; if we want our ropes to be able to rotate objects, we will need our system to account for rotational forces, known as torque. Using torque, we can use math to determine how far to rotate an object to reach equilibrium.

{% include lazyload.html img="/assets/img/rope/torque_demo_1.gif" caption="An actor with the BP_StylizedPhysicsSolver will treat all incoming ropes with equal influence if they are taut. Note that the rope in this example is rotating the pulley while not being 100% taut. Optionally, users can set a threshold to linearly interpolate the influence. Here, the threshold is 20%. This means the rope is considered taut if the distance is at least 80% of the true length of the rope." %}

First, given a force ($F$) acting on an object and it's distance from that object's center of mass ($r$), we can calculate torque in a very straightforward way:

$$ \tau = r \times F = r F \sin(\theta)$$

We can now determine the torque caused by each rope attached to the object. In practice, the combined torque within a system is similar to regular motion:

$$ \vec{\tau}_{total} = \sum_{i=1}^{n} \vec{\tau}_{\text{tension}, i} $$

We can convert torque into rotation by using Newton's second law, which describes a ratio between torque and angular acceleration:

$$ \tau = I \alpha $$

Here, $I$ is equal to the [moment of intertia](https://en.wikipedia.org/wiki/Moment_of_inertia), which determines how objects rotate according to an object's distribution of mass. UE5 provides a helpful way to calculate [moment of intertia](https://dev.epicgames.com/documentation/en-us/unreal-engine/BlueprintAPI/Physics/ScalebyMomentOfInertia?application_version=5.2) from a mesh, but I had trouble getting those functions to work properly (most likely due to overlapping geometry). Instead, I treat all objects as having a moment of inertia equal to a sphere with a radius half the size of the object's bounding box. This is by no means physically accurate (hence BP_**Stylized**PhysicsSolver), but simple objects will mostly rotate as expected.

With angular acceleration $\alpha$, we can use a similar state-based approach as motion:

$$ \alpha = \frac{\tau}{I} $$

$$ \omega_{\text{new}} = \omega_{\text{old}} + \alpha \cdot \Delta t $$

$$ \theta = \omega \cdot \Delta t $$

With our final degrees calculated, we can convert this to a quaternion and rotate our object appropriately.

{% include lazyload.html img="/assets/img/rope/rotational_forces.png" caption="Final Blueprint for rotation." %}

## Rope Systems

Now that we have a way to connect ropes to attach points to form physics constraints, we can create rope systems by connecting multiple ropes segments together into rope chains. The basic strategy is to create a new actor, separate from the existing actors, that contain a dictionary of ropes and their connections. We can monitor each rope's change in length, and propagate any change in length to subsequent segments.

Our rope systems will emulate a rope moving through a system by changing the UV offset for textures. Imagine three rope segments connected by two pulleys. If one end is pulled through the system, the length of the first and third segment should change, but the middle segment should not necessary change length. In this case, the middle segment needs to display a change in texture to demonstrate the rope spooling through the segment. In this sense, we are virtually "linking" all rope UVs together into a single UV system.

To resolve rope length, we have two options:

1. **Generator Chains**: Total rope length of the entire chain can increase to accommodate for positive offset. The first rope in a chain will act as a generator, creating new rope length if necessary.
2. **Static Chains**: Total rope length of the entire chain will remain static. Rope offset will be subtracted from the length of the first rope in the system.

These two modes allow our system to be used for different applications. For example, if we want our ropes to be used for something like ship rigging, we probably want to use a Generator style chain, since there's lots of moving ropes being spooled. If we want a functional pulley system to lift objects, we probably want a static chain.

{% include lazyload.html img="/assets/img/rope/ropesystem_Blueprint.png" caption="Subset of the blueprint to calculate and pass offset to ropes." %}

{% include lazyload.html img="/assets/img/rope/system_demo.gif" caption="Rope system in action: pulling on a rope will impact the texture of all ropes in the system. Ropes will spool according to their movement. The first rope in the chain is designated as a \"generator\" rope, which means new length will simply be added to that rope instead of removed." %}

## Conclusion and Possible Improvements

Overall, I'm very satisfied with this rope system. While we cannot use our ropes to create complex knots, we can create convincing rope chains, which satisfy many cases when creating eye candy. This system is especially useful for kinetic environments that make heavy use of ropes, like swaying ships or seige equipment.

One improvement I'd like to add is support for angular limits when connecting rope segments to objects. Unreal Engine physics constraints comes with good support for angular limits, which allows designers to specify how much a ball/socket joint can rotate, and which axis are enabled. This is important for objects like pulleys, which have very clear angular limits on all connection points.


