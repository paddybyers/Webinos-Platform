@echo off
@rem Check for gyp
if not defined GYP_ROOT goto gyp-not-found
if not exist "%GYP_ROOT%\gyp" goto gyp-not-found
@rem Check for nodejs build location variable
if not defined NODE_ROOT goto nodebuild-not-found
if not exist "%NODE_ROOT%\src\node.h" goto nodebuild-not-found
if not exist "%NODE_ROOT%\deps\v8\include\v8.h" goto nodebuild-not-found
if not exist "%NODE_ROOT%\deps\uv\include\uv.h" goto nodebuild-not-found
@rem detect the location of the node.lib file
set node_lib_folder=
if exist "%NODE_ROOT%\Release\node.lib" set node_lib_folder=Release
if not defined node_lib_folder if exist "%NODE_ROOT%\Debug\node.lib" set node_lib_folder=Debug
if not defined node_lib_folder goto nodebuild-not-found

@rem Generate visual studio solution
python %GYP_ROOT%\gyp -f msvs -G msvs_version=2010 %1 --depth=. -DNODE_ROOT=%NODE_ROOT% -Dnode_lib_folder=%node_lib_folder%
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
echo Node build path not found! Please check the NODE_ROOT path variable exists and that it points to the root of the git repo where you have build 
goto exit
:exit-error
echo An error occured. Please check the above output
:exit
set node_lib_folder=
