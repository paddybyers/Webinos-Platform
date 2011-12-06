{
  'variables': {
    'target_arch': 'ia32',
  },
  'targets': [
    {
      'target_name': 'helloworld',
      'type': '<(library)',
	  
      'include_dirs': [
        '<(node_path)/src',
        '<(node_path)/deps/v8/include',
        '<(node_path)/deps/uv/include',
      ],
      'sources': [
        'HelloWorld.cpp',
      ],

      'defines': [
        'ARCH="<(target_arch)"',
        'PLATFORM="<(OS)"',
      ],

      'conditions': [
        [ 'OS=="win"', {
          'defines': [
            'uint=unsigned int',
            # we need to use node's preferred "win32" rather than gyp's preferred "win"
            'PLATFORM="win32"',
          ],
          'libraries': [ '-l<(node_path)/Debug/node.lib' ]
        },{ # POSIX
          'defines': [ '__POSIX__' ],
          'sources': [ #we can have different sources for secure store for example
            'src/node_signal_watcher.cc',
            'src/node_stat_watcher.cc',
            'src/node_io_watcher.cc',
          ]
        }],
        [ 'OS=="mac"', {
          'sources': [ 'src/platform_darwin.cc' ],
          'libraries': [ '-framework Carbon' ],
        }],
        [ 'OS=="linux"', {
          'sources': [ 'src/platform_linux.cc' ],
          'libraries': [
            '-ldl',
            '-lutil' # needed for openpty
          ],
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

