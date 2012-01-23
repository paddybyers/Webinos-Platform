{
	'variables': {
		# These are required variables to make a proper node module build
		# MAC x64 will have to comment out all line in 
		# gyp\pylib\gyp\generator\make.py that contain append('-arch i386') (2 instances)
		# in order to make a proper 64 bit module
		'output_directory': 'build/Release', # The output dir resembles the old node-waf output in order to keep the old references
	},
	'target_defaults': {
		# Some default properties for all node modules
		'type': '<(library)', # Check https://github.com/joyent/node/pull/2337#r307547
		'product_extension':'node',
		'product_dir':'<(output_directory)',
		'product_prefix':'',# Remove the default lib prefix on each library

		'include_dirs': [
			'<(NODE_ROOT)/src',
			'<(NODE_ROOT)/deps/v8/include',
			'<(NODE_ROOT)/deps/uv/include',
		],

		'conditions': [
			[ 'OS=="win"', {
				'defines': [
					# We need to use node's preferred "win32" rather than gyp's preferred "win"
					'PLATFORM="win32"',
				],
				# We need to link to the node.lib file
				'libraries': [ '-l<(node_lib_file)' ],
				'msvs_configuration_attributes': {
					'OutputDirectory': '<(output_directory)',
					'IntermediateDirectory': '<(output_directory)/obj',
				},
				'msvs-settings': {
					'VCLinkerTool': {
						'SubSystem': 3, # /subsystem:dll
					},
				},
			}],
			[ 'OS=="mac"', {
				'libraries': [ # This specifies this library on both the compiler and the linker for make
					'-undefined dynamic_lookup',
				],
				'xcode_settings': { # This is the way to specify it for xcode
					'OTHER_LDFLAGS': [
						'-undefined dynamic_lookup'
					]
				},
				# Based on gyp's documentation, the following should be enough but it seems 
				# it doesn't work.
				# 'link_settings': {
				#	'ldflags': [
				#		‘-undefined dynamic_lookup’,
				#	],
				# },
			}],
		],
	}
}