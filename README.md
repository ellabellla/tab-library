# Tab Library

A chrome extension that can save a window with all it's tabs and groups into a markdown library and then load it back. 

Tabs not in any groups will be placed as bullet points under the main heading, which will be the name of the file. Groups of tabs are turned into subheadings with bullet points of their respective tabs. The color of each group is placed next to it as an embedded image.


## [Example](example.md)
```
# Example
 - Google
   - https://www.google.com/
## Videos ![](https://placehold.co/15x15/blue/blue.png)
 - YouTube
   - https://www.youtube.com/
 - Rick Astley - Never Gonna Give You Up (Official Music Video) - YouTube
   - https://www.youtube.com/watch?v=dQw4w9WgXcQ
## Github ![](https://placehold.co/15x15/red/red.png)
 - GitHub
   - https://github.com/
 - ellabellla (Ella Pash)
   - https://github.com/ellabellla
```

## Install
1. clone the repo
   - ```git clone https://github.com/ellabellla/tab-library.git``` 
2. Go to the extensions page ```chrome://extensions```
3. Enable developer mode
   -  Click the developer mode toggle switch
4. Click load unpacked and select the cloned repo's location 

## License
This software is provided under the MIT license. [Click](LICENSE) here to view.