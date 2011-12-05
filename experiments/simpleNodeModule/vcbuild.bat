@echo OFF
@rem Check for visual studio tools
if not defined VS100COMNTOOLS goto msbuild-not-found
if not exist "%VS100COMNTOOLS%..\..\vc\vcvarsall.bat" goto msbuild-not-found
call "%VS100COMNTOOLS%..\..\vc\vcvarsall.bat"
if not defined VCINSTALLDIR goto msbuild-not-found
set tmpLib= %lib%
set tmpInclude= %include%
set lib= %node_path%\Debug;%lib%
set include= "%node_path%\src\";"%node_path%\deps\uv\include\";"%node_path%\deps\v8\include\";%include%
mkdir build\default
@rem filename "no banner" "preproc def _Windll" "no optimization" "calling conversion __cdecl"
cl.exe helloworld.cpp /c /nologo /D "_WINDLL" /D "BUILDING_NODE_EXTENSION=1" /Od /Gd  /analyze- /I%node_path%\src\
echo "Done compiling"
@rem CL.exe /c /ZI /nologo /W3 /WX- /Od /Oy- /D "BUILDING_NODE_EXTENSION=1" /D _WINDLL /D _MBCS /Gm /EHsc /RTC1 /MDd /GS /fp:precise /Zc:wchar_t /Zc:forScope /Gd /TP /analyze- HelloWorld.cpp
if errorlevel 1 goto exit
link helloworld.lib node.lib /OUT:"helloworld.dll" /NOLOGO /DLL /NOENTRY /MANIFEST:NO /TLBID:1 /DYNAMICBASE /NXCOMPAT /MACHINE:X86 /LIBPATH:%node_path%\Debug
if errorlevel 1 goto exit
echo "Cleaning up"
move helloworld.dll build\default\helloworld.node
del helloworld.obj

goto exit
:msbuild-not-found
echo Visual studio tools were not found! please check the VS100COMNTOOLS path variable
goto exit


:exit
set lib= %tmpLib%
set include= %tmpInclude%