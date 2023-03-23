#!/bin/bash
set -e
BASEDIR=$(realpath $(dirname "$0"))
cd "$BASEDIR"

convert -selective-blur 8x8+30% ../public/gltf/Suzanne_Bake1_PBR_Lightmap.jpg ../public/gltf/Suzanne_Bake1_PBR_Lightmap_denoise.jpg
convert -selective-blur 8x8+30% ../public/gltf/Plane_Bake1_PBR_Lightmap.jpg ../public/gltf/Plane_Bake1_PBR_Lightmap_denoise.jpg
convert -selective-blur 8x8+30% ../public/gltf/Cube_Bake1_PBR_Lightmap.jpg ../public/gltf/Cube_Bake1_PBR_Lightmap_denoise.jpg

convert -selective-blur 8x8+30% -blur 2x2 ../public/gltf/Suzanne_Bake1_PBR_Ambient\ Occlusion.jpg ../public/gltf/Suzanne_Bake1_PBR_Ambient_Occlusion_denoise.jpg
convert -selective-blur 8x8+30% ../public/gltf/Plane_Bake1_PBR_Ambient\ Occlusion.jpg ../public/gltf/Plane_Bake1_PBR_Ambient_Occlusion_denoise.jpg
convert -selective-blur 8x8+30% ../public/gltf/Cube_Bake1_PBR_Ambient\ Occlusion.jpg ../public/gltf/Cube_Bake1_PBR_Ambient_Occlusion_denoise.jpg
