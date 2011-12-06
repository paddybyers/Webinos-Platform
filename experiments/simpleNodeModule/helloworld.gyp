{
  'variables': {
    'target_arch': 'ia32',
	'library': 'shared_library',
  },
  'targets': [
    {
      'target_name': 'helloworld',
      'type': '<(library)',
	  
      'sources': [
        'HelloWorld.cpp',
      ],

      'defines': [
        'ARCH="<(target_arch)"',
        'PLATFORM="<(OS)"',
      ],
	  
      'include_dirs': [
        '<(NODE_ROOT)/src',
        '<(NODE_ROOT)/deps/v8/include',
        '<(NODE_ROOT)/deps/uv/include',
      ],

      'conditions': [
        [ 'OS=="win"', {
          'defines': [
            'uint=unsigned int',
            # we need to use node's preferred "win32" rather than gyp's preferred "win"
            'PLATFORM="win32"',
          ],
          'libraries': [ '-l<(NODE_ROOT)/<(node_lib_folder)/node.lib' ],
        },
        [ 'OS=="mac"', {
          # 'libraries': [ '-framework Carbon' ],
        }],
        [ 'OS=="linux"', {
          
        }],
        [ 'OS=="freebsd"', {
          'sources': [ 'src/platform_freebsd.cc' ],
          'libraries': [
            '-lutil',
            '-lkvm',
          ],
        }],
        [ 'OS=="solaris"', {
          'sources': [ 'src/platform_sunos.cc' ],
          'libraries': [
            '-lkstat',
          ],
        }],
      ],
      'msvs-settings': {
        'VCLinkerTool': {
          'SubSystem': 3, # /subsystem:dll
        },
      },
    },
  ] # end targets
}

