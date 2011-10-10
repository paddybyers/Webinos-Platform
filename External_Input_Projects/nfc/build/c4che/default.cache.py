AR = '/usr/bin/ar'
ARFLAGS = 'rcs'
CCFLAGS = ['-g']
CCFLAGS_LIBNFC = ['-pthread']
CCFLAGS_LIBPCSCLITE = ['-pthread']
CCFLAGS_MACBUNDLE = ['-fPIC']
CCFLAGS_NODE = ['-D_LARGEFILE_SOURCE', '-D_FILE_OFFSET_BITS=64']
CC_VERSION = ('4', '5', '2')
COMPILER_CXX = 'g++'
CPP = '/usr/bin/cpp'
CPPFLAGS_NODE = ['-D_GNU_SOURCE', '-DEV_MULTIPLICITY=0']
CPPPATH_LIBNFC = ['/usr/local/include', '/usr/include/PCSC']
CPPPATH_LIBPCSCLITE = ['/usr/include/PCSC']
CPPPATH_NODE = '/usr/include/nodejs'
CPPPATH_ST = '-I%s'
CXX = ['/usr/bin/g++']
CXXDEFINES_ST = '-D%s'
CXXFLAGS = ['-g']
CXXFLAGS_DEBUG = ['-g']
CXXFLAGS_LIBNFC = ['-pthread']
CXXFLAGS_LIBPCSCLITE = ['-pthread']
CXXFLAGS_NODE = ['-D_LARGEFILE_SOURCE', '-D_FILE_OFFSET_BITS=64']
CXXFLAGS_RELEASE = ['-O2']
CXXLNK_SRC_F = ''
CXXLNK_TGT_F = ['-o', '']
CXX_NAME = 'gcc'
CXX_SRC_F = ''
CXX_TGT_F = ['-c', '-o', '']
DEST_BINFMT = 'elf'
DEST_CPU = 'x86_64'
DEST_OS = 'linux'
FULLSTATIC_MARKER = '-static'
HAVE_LIBNFC = 1
HAVE_LIBPCSCLITE = 1
HAVE_LIBUSB = 1
LIBDIR = '/home/dsr/.node_libraries'
LIBPATH_LIBNFC = ['/usr/local/lib']
LIBPATH_NODE = '/usr/lib'
LIBPATH_ST = '-L%s'
LIB_LIBNFC = ['nfc', 'usb', 'pcsclite']
LIB_LIBPCSCLITE = ['pcsclite']
LIB_LIBUSB = ['usb']
LIB_ST = '-l%s'
LINKFLAGS_LIBNFC = ['-pthread']
LINKFLAGS_LIBPCSCLITE = ['-pthread']
LINKFLAGS_MACBUNDLE = ['-bundle', '-undefined', 'dynamic_lookup']
LINK_CXX = ['/usr/bin/g++']
NODE_PATH = '/home/dsr/.node_libraries'
PREFIX = '/usr/local'
PREFIX_NODE = '/usr'
RANLIB = '/usr/bin/ranlib'
RPATH_ST = '-Wl,-rpath,%s'
SHLIB_MARKER = '-Wl,-Bdynamic'
SONAME_ST = '-Wl,-h,%s'
STATICLIBPATH_ST = '-L%s'
STATICLIB_MARKER = '-Wl,-Bstatic'
STATICLIB_ST = '-l%s'
defines = {'HAVE_LIBUSB': 1, 'HAVE_LIBPCSCLITE': 1, 'HAVE_LIBNFC': 1}
macbundle_PATTERN = '%s.bundle'
program_PATTERN = '%s'
shlib_CXXFLAGS = ['-fPIC', '-DPIC']
shlib_LINKFLAGS = ['-shared']
shlib_PATTERN = 'lib%s.so'
staticlib_LINKFLAGS = ['-Wl,-Bstatic']
staticlib_PATTERN = 'lib%s.a'
