@echo off
@rem Check for gyp
if not defined gyp_path goto gyp-not-found
if not exist "%gyp_path%\gyp" goto gyp-not-found
@rem Check for nodejs build location variable
if not defined node_path goto nodebuild-not-found
if not exist "%node_path%\src\node.h" goto nodebuild-not-found
if not exist "%node_path%\deps\v8\include\v8.h" goto nodebuild-not-found
if not exist "%node_path%\deps\uv\include\uv.h" goto nodebuild-not-found
@rem detect the location of the node.lib file
set node_lib_folder=
if exist "%node_path%\Release\node.lib" set node_lib_folder=Release
if not defined node_lib_folder if exist "%node_path%\Debug\node.lib" set node_lib_folder=Debug
if not defined node_lib_folder goto nodebuild-not-found

@rem Generate visual studio solution
python %gyp_path%\gyp -f msvs -G msvs_version=2010 helloworld.gyp --depth=. -Dnode_path=%node_path% -Dnode_lib_folder=%node_lib_folder%
if errorlevel 1 goto exit-error
echo Finished
goto exit
:msbuild-not-found
echo Visual studio tools were not found! Please check the VS100COMNTOOLS path variable
goto exit
:gyp-not-found
echo GYP was not found. Please set the environment variable that points to the folder where the gyp executable is located
goto exit
:nodebuild-not-found
echo Node build path not found! Please check the node_path path variable exists and that it points to the root of the git repo where you have build 
goto exit
:exit-error
echo An error occured. Please check the above output
:exit
set node_lib_folder=
