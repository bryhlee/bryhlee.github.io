---
layout: project
title:  "Deformable Sweep Mesh Tool from B-Spline CP Transformations"
date:   2023-06-19 23:17:56 -0700
tags: maya python
intro: Adds a new tool to Maya to build deformable sweep meshes from CP curves which works for all transofmration operations
thumbnail: /assets/img/curve-deformer/thumbnail.png
---

This Maya plugin provides a tool to build deformable curve meshes with built-in transformation deformers located at the curve's control points. The tool, called *Curve Mesh*, is an expansion upon Sweep Mesh, and enhances the options to manipulate a swept mesh in a predictable, art-directable way. This approach surpasses traditional manual rigging or skinning methods in efficiency and performance, offering a solution that is less time-consuming and more accurate in reflecting the properties of a curve mesh.

![Curve Mesh: Example](/assets/img/curve-deformer/start.gif)
*All transformations are unlocked on the curve CPs, deforming the Sweep Mesh accurately.*

This project was inspired by a [feature](https://en.wikibooks.org/wiki/Blender_3D:_Noob_to_Pro/Bevelling_a_Curve) that is bundled with Blender's NURBS curves by default, which allows the user to create meshes from a curve, similar to Sweep Mesh. However, the curve EPs have a full transofrmation matrix, and can apply transformations on the generated based on a B-spline algorithm. The technique introduced in my tool for Maya uses a different strategy but achieves a similar result.

![Curve Mesh: Keyable](/assets/img/curve-deformer/wave.gif)
*Like all transform nodes, the Curve Mesh is keyable.*

The Curve Mesh tool is particularly useful for creating and grooming stylized hair. As a superset of the Sweep Mesh tool, all the Sweep Mesh options are still exposed, including custom cross section profiles. Utilizing the transformations at the CP points provides natural weighting that is useful for manipulating hair chunks.

![Curve Mesh: Stylized Hair](/assets/img/curve-deformer/hair.gif)
*Creating stylized hair has never been easier! Hair strands can be bent, stretched, and rotated along the curve.*