---
layout: project
title:  "Gradient LUT Shading Model and Engine Mod"
date: 2023-03-04 22:04:21 -0700
tags: unreal HLSL c++
thumbnail: /assets/img/gradient/thumbnail.png
---

This project introduces a modification to the Unreal Engine 5.1 rendering pipeline that adds a new shading model driven by custom LUT gradient curves. A subsystem provides an interface to the GBuffer by exposing a LUT Color Atlas inside the HLSL rendering path, which can influence any lit object.

![Gradient Shading Model](/assets/img/gradient/compare.png)
***Left**: The model emulating a cel-shade/toon shader based on a stylized, 3-step gradient. **Right**: The same character with the Default Lit model.*

This model can be adapted to fit many common visual paradigmns such as "toon"/"celshade" shaders, or as an aid to other stylized materials. I further modified the engine to allow precalculated shadowed surfaces to correctly emit color even when there is no immediate light source. For example, we can use a [half-lambert shading technique](https://steamcdn-a.akamaihd.net/apps/valve/2007/NPAR07_IllustrativeRenderingInTeamFortress2.pdf) as a base layer to our new shading algorithm to allow the gradient curve to override lighting conditions. This is particularly useful for certain situations where achieving visual consistency in shadowed areas is more important than physically-accurate lighting.

![Gradient LUT Curve: Celshade](/assets/img/gradient/curve.png)
*A highly stylized shading curve. The dark end of the gradient is colored blue to emulate comic-book celshading.*

![Gradient LUT Curve: Material Sphere](/assets/img/gradient/celshade.png)
*A material sphere with the above curve. Note the blue tint. Typically, the Unreal Engine rendering pipeline ignores unlit areas for performance. Here, I recalculate the darkest tint based on the curve at a very low cost.*

This project was inspired by the modifications added by [Riot Games](https://technology.riotgames.com/news/valorant-shaders-and-gameplay-clarity){:target="_blank"} to support stylized shaders in Valorant. My methodology, based on Unreal Engine 5.1, can achieve similar fine-grain look development in-engine, including emulation of subsurface scattering within skin.

![Simulating SS Scattering in Skin](/assets/img/gradient/ss_skin.gif)
*The model updates in real time to reflect the curve colors. Here, I add a red tint to shadowed skin to simmulate SS. This technique is used in Valorant for most characters and is art-directable.*

One advantage of my LUT shading model is that it does not require forward rendering to calculate per-per shading; instead, the LUT curve is provided directly to the buffer through a subsystem. You can easily change the curve you want for your material by selecting a different curve index from the Atlas.