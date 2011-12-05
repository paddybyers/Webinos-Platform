@echo OFF
@rem Check for nodejs build location variable
if not defined node_path goto nodebuild-not-found
if not exist "%node_path%\src\node.h" goto nodebuild-not-found
if not exist "%node_path%\deps\v8\include\v8.h" goto nodebuild-not-found
if not exist "%node_path%\deps\uv\include\uv.h" goto nodebuild-not-found
@rem detect the location of the node.lib file
set nodelibpath=
if exist "%node_path%\Release\node.lib" set nodelibpath=%node_path%\Release
if not defined nodelibpath if exist "%node_path%\Debug\node.lib" set nodelibpath=%node_path%\Debug
if not defined nodelibpath goto nodebuild-not-found
@rem Check for visual studio tools if not already loaded
if defined VCINSTALLDIR goto start-compilation
if not defined VS100COMNTOOLS goto msbuild-not-found
if not exist "%VS100COMNTOOLS%..\..\vc\vcvarsall.bat" goto msbuild-not-found
call "%VS100COMNTOOLS%..\..\vc\vcvarsall.bat"
if not defined VCINSTALLDIR goto msbuild-not-found
:start-compilation
echo Compiling...
@rem filename "don't strip comments" "no banner" "disable intrinsic functions" "preproc def _Windll and BUILDING_NODE_EXTENSION=1" "no optimization" "calling conversion __cdecl" "no analysis" "the /I adds some folders in the include path" "no clr. This is deprecated and should be changed but I am working on a gyp file instead of this bat"
cl.exe helloworld.cpp /c /nologo /Oi- /D "_WINDLL" /D "BUILDING_NODE_EXTENSION=1" /Od /Gd /analyze- /I%node_path%\src\ /I%node_path%\deps\v8\include\ /I%node_path%\deps\uv\include\ /clr:noAssembly
if errorlevel 1 goto exit-error
echo Done compiling. Linking...
echo Using %nodelibpath%\node.lib file to link to
link helloworld.obj node.lib /OUT:"helloworld.dll" /NOLOGO /DLL /NOENTRY /MANIFEST:NO /TLBID:1 /DYNAMICBASE /NXCOMPAT /MACHINE:X86 /LIBPATH:%nodelibpath%
if errorlevel 1 goto exit-error
echo Done linking
echo Cleaning up
if not exist build\default mkdir build\default
move helloworld.dll build\default\helloworld.node
del helloworld.obj helloworld.lib helloworld.exp
echo Finished
goto exit
:msbuild-not-found
echo Visual studio tools were not found! Please check the VS100COMNTOOLS path variable
goto exit

:nodebuild-not-found
echo Node build path not found! Please check the node_path path variable exists and that it points to the root of the git repo where you have build 
goto exit
:exit-error
echo An error occured. Please check the above output
:exit
