#!/bin/bash

# Replace spaces with hyphens in subfolder names
for dir in ./*/; do
    newname=$(echo "$dir" | sed 's/ /-/g')
    if [ "$dir" != "$newname" ]; then
        mv "$dir" "$newname"
    fi
done

# Delete specific folders
rm -rf ./*/reveal.js-master/examples
rm -rf ./*/reveal.js-master/test
rm -rf ./*/reveal.js-master/.github

# Delete only files directly under reveal.js-master
find ./*/reveal.js-master -maxdepth 1 -type f -delete
