#!/bin/bash
set -e
BASEDIR=$(realpath $(dirname "$0"))
cd "$BASEDIR"

objects=( Abstellbuegel BadInnen BadWand FensterHintenBreit FensterHintenSchmal FensterVorn GitterBreit GitterSchmal Laubengang-EG Laubengang-Rand LaubengangOG RiegelFrontEternit Room Schwelle_Vorn Stuetze )
#objects=( Werkstrasse WerkstrasseRand )

for obj in "${objects[@]}"
do
	if test -f "../bakes/${obj}_Bake1_PBR_Lightmap.exr"; then
		echo "Converting maps for $obj"
		convert \( -selective-blur 6x6+40% -blur 1x1 -channel RGB -level 0.2%,180%,1.0 ../bakes/${obj}_Bake1_PBR_Lightmap.exr \) \
				\( -selective-blur 3x3+40% -blur 1x1              -level 2.0%,130%,1.0 ../bakes/${obj}_Bake1_PBR_Ambient\ Occlusion.exr \) \
			-compose Multiply -composite \
			-resize 1024x1024 -compress DWAB ../public/bakes/${obj}_map.exr
			#-depth 16 -colorspace RGB \
			#PNG64:../public/bakes/${obj}_map.png
	fi
done

cp -f ../bakes/Room2.* ../public/gltf/
cp -f ../bakes/BakeTestTex/* ../public/gltf/BakeTestTex/
