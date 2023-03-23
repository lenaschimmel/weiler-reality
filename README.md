# Simple Three.js + TypeScript + Vite Starter

Based on https://github.com/mayacoda/simple-threejs-typescript-starter

Integrating VR / XR into the starter code has been a hassle - it cuts through many different aspects that are cleanly separated in the engine code, and breaks that separation. There's huge potential for cleanup later.

I don't want to put the large texture files and models into the git repo, neither those that can be downloaded from some websites, nor those that are generated from my blender files. So this repo is not usable without getting those files from somewhere else.

After exporting from Blender using SimpleBake, you need to run `scripts/enhance_lightmaps.sh` manually.

The rest of this README is just my personal notes right now.

## Lightmap support

Work in Progress mit Lightmaps:

- Jedem Mesh manuell zwei UVs geben funktioniert:
  - das erste so wie ich es für die Texturen brauche (darf größer als 0..1 sein und/oder sich selbst überlappen)
  - das zweite ist für die Lightmap, muss "SimpleBake" heißen, muss innerhalb von 0..1 und überlappungsfrei sein
- ThreeJS lädt beide UVs, die im GLTF eh schon TEXCOORD_0 und TEXCOORD_1 heißen
- Denoise
  - "Denoise (Cycles)" macht Ränder kaputt
  - "Denouse (Compositor)" bekomme ich nicht zum Laufen
  - Also ggf. manuell bzw. mit imagemagick denoisen, z.B. mit http://www.fmwconcepts.com/imagemagick/denoise/index.php
- Zu viel Output. Ich brauche nur das erste von diesen beiden:
  - <ObjectName>\_Bake1_PBR_Lightmap.jpg
  - <ObjectName>\_Bake1_CyclesBake_COMBINED.jpg

## Was fehlt

Damit die Materialien echt wirken, muss ich wohl mit gerichtetem Licht für Specular arbeiten, also mit klassischen Lichtquellen. Da brauche ich entweder klassische Realtime-Schattenberechnung, oder eine extra Shadow-Map. Und die Lightmap würde ich dann für Diffuse nutzen, ggf. mit Ambient Occlusion kombiniert. Nicht sicher, wie viel davon schon von SimpleBake und vor allem von den ThreeJS-Materialien unterstützt wird.

Außerdem mal probieren, die [envMap](https://threejs.org/docs/index.html#api/en/materials/MeshStandardMaterial.envMap) zu setzen.
