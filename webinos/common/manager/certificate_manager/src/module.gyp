{
  'variables': {
    'module_name': 'certificate_manager',#Specify the module name here
	#you may override the variables found in node_module.gypi here or through command line
	#TODO: Fix this to include your own openssl lib
	'openssl_Root': '../../../../../../openssl-1.0.0e',
  },
  'targets': [
    {
		'sources': [ #Specify your source files here
			'certificate_manager.cpp',
			'openssl_wrapper.cpp',
		],
	  
		'conditions': [
        [ 'OS=="win"', {
		  #we need to link to the libeay32.lib
          'libraries': [ '-l<(NODE_ROOT)/<(node_lib_folder)/node.lib','-l<(openssl_Root)/out32dll/libeay32.lib' ],
		  'include_dirs': [
		   '<(openssl_Root)/include',
		  ],
        }],
        [ 'OS!="win"', {
		  'libraries': [ #this is a hack to specify this linker option in make              
			'-libs libssl',
		  ],
        }],
      ],
		
		'includes': [ #This files loads all the required conditional staff for mac linux windows etc
			# Don't forget to update the following to point to the node_module.gypi
			'../../../../../Tools/gyp_tools/node_module.gypi',
		],
    },
  ] # end targets
}

