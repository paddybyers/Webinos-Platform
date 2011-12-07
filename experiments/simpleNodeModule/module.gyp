{
  'variables': {
    #Specify the module name here
    'module_name': 'helloworld',
	#These are required variables to make a proper node module build
	'library': 'shared_library',
	'target_arch': 'ia32', #Warning: gyp's make.py file hardcodes the -arch i386
  },
  'targets': [
    {
      'sources': [
        'HelloWorld.cpp',
      ],
	  
	  'target_name': '<(module_name)',
      'type': '<(library)',
	  'product_name':'<(module_name)',
	  'product_extension':'node',
	  'product_dir':'build/default',
	  #remove the default lib prefix on each library
      'product_prefix':'',

      'defines': [
	    'ARCH="<(target_arch)"',
        'PLATFORM="<(OS)"',
		'_LARGEFILE_SOURCE',
		'_FILE_OFFSET_BITS=64',
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
		  'msvs_configuration_attributes': {
              'OutputDirectory': 'build\\default',
			  'IntermediateDirectory': 'build\\default\\obj',
		  },
		  'msvs-settings': {
		    'VCLinkerTool': {
				'SubSystem': 3, # /subsystem:dll
		      },
		   },
        }],
        [ 'OS=="mac"', {
		  'libraries': [ #this is a hack to specify this linker option in make              
              '-undefined dynamic_lookup',
		   ],
        }],
        [ 'OS=="linux"', {
          
        }]
      ],
    },
  ] # end targets
}

