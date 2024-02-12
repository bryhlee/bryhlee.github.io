---
layout: project
title:  "Realistic Snow Dyanmics in Unreal Engine 5.1"
date:   2023-06-19 23:17:56 -0700
tags: unreal shaders environment
thumbnail: /assets/img/snow-dynamic/intro.png
intro: Render realistic interactive snow dynamics on any arbitrary landscape in Unreal Engine using Render Targets and Runtime Virtual Textures, with efficient tesselation based on Nanite-driven LODs
---

This project utilizes Unreal Engine 5.1 to implement realistic snow dynamics, employing virtual runtime textures and dynamic GPU-based Level of Details (LODs) for efficient simulation of snow displacement. By utilizing a web of shaders and material expressions, I developed a method for detailed landscape mesh displacement that can work with any actor in a predetermined "snow" zone.

![Snow Trails in Unreal Engine 5.1](/assets/img/snow-dynamic/demo.gif)

During this project, I navigated through several technical challenges, including performance limiations and the use of Unreal 5.1's Virtual Heightfield Mesh (VHM) plugin. Ultimately, a mix of various techniques were required to achieve the desired snow trail effect. For a detailed breakdown of my experience solving these problems, please read the [associated blog post](/blog/2023/06/12/snow-dynamic).