#!/bin/bash
set -e
BASEDIR=$(realpath $(dirname "$0"))
cd "$BASEDIR"

objects=( Room BadWand BadInnen FensterHintenBreit FensterHintenSchmal ) # FensterVorn

for obj in "${objects[@]}"
do
	echo "Converting maps for $obj"
	convert -selective-blur 6x6+40% -blur 1x1 -channel RGB -level 0.2%,180%,1.0 ../public/gltf/${obj}_Bake1_PBR_Lightmap.exr -depth 16 -colorspace RGB PNG64:../public/gltf/${obj}_Bake1_PBR_Lightmap_denoise.png
	convert -selective-blur 3x3+40% -blur 1x1 -level 2%,130%,1.0 ../public/gltf/${obj}_Bake1_PBR_Ambient\ Occlusion.exr -colorspace RGB ../public/gltf/${obj}_Bake1_PBR_Ambient_Occlusion_denoise.jpg
done