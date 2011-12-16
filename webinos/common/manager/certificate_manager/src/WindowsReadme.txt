In order to compile in windows you will have to (based on http://www.ski-epic.com/2007_notes_on_openssl/index.html):

* download an install perl from http://www.activestate.com/activeperl/downloads. Don't forget to reboot to have parl in the path.
* Download source files of openssl from http://www.openssl.org/source/ and extract it. (WARNING: Some zip programs, like 7zip I use, do not restore the links properly. Verify that the include\openssl contains non empty files! I had to do it with python running the following commands:
** import tarfile
** o = tarfile.open("openssl-1.0.0e.tar")
** o.extractall()
** o.close()
)
* Fireup a visual studio command line (or run 'call "%VS100COMNTOOLS%..\..\vc\vcvarsall.bat" ' on an existin one)
* Read the INSTALL.W32 file in the source dir for commands. On a x64 machine I did the following:
** perl Configure VC-WIN32 no-asm
** ms\do_ms
** nmake -f ms\ntdll.mak  (you will need to have Microsoft Macro Assembler installed)


