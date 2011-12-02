Building on Windows

NOTE: Requires Visual Studio 2010. I didn't test with the Express version, but it should do.

1. Build node

    Download node (either the tarball or via a git clone; THE INSTALLER WON'T DO!)
    Run vcbuild.bat from the command line. This should be completely automated and you'll end up with a working node.exe in the Debug folder
    Add the absolute path to the Debug folder inside your node checkout to %PATH%. To do this, right-clicking on "Computer" in the right side of the task bar, then hit "Properties". In that dialog, hit "Advanced system settings" in the left column and click on the "Environment Variables..." button. In the lower last, look for Path, and using the "Edit..." button, add the path separated with a semicolon.
    Log out and in.

2. Unpack SQLite3

    In the deps folder of your node-sqlite3 folder, unzip sqlite-autoconf-3070800.tar.gz (e.g. using 7-Zip) and rename the extracted folder to sqlite3. Directly in that folder, you should see sqlite3.c and sqlite3.h.

3. Build the module

    Create a copy of node_extension.SAMPLE.props and name it node_extension.props.
    Open the node-sqlite3.sln solution file in Visual Studio 2010
    Go to the "Property Manager" pane (if you can't see it, it's in the View menu), right-click on the "node_extension" property sheet, and open its properties. In C/C++ → General, change all three paths in "Additional Include Directories" to match those on your system. Do the same in Linker → General and change the path in "Additional Library Directories". Close the window with "OK".
    Now, click Build → Build Solution.

