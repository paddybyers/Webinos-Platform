{
	# we are in prototyping fase, this module.gyp is not ready and gyp compilation is not woring
	# use "node-waf configure build" instead

	'variables': {
		'module_name': 'unixlib',#Specify the module name here
		#you may override the variables found in node_module.gypi here or through command line
		'conditions': [
			[ 'OS=="linux" or OS=="mac"', {
				'host_arch': ['uname -m | sed -e "s/i.86/ia32/;s/x86_64/x64/;s/amd64/x64/;s/arm.*/arm/;s/i86pc/ia32/"'],
				'target_arch': ['host_arch']
			}],
			[ 'OS!="linux" and OS!="mac"', {
				'host_arch': ['ia32'],
				'target_arch': ['host_arch']
			}]
		],
	},
	'targets': [
    {
		# Needed declarations for the target
		'target_name': '<(module_name)',
		'product_name':'<(module_name)',
		'sources': [ #Specify your source files here
			'unixlib/unixlib.cc'
		],
		'conditions': [
			[ 'OS=="linux" or OS=="mac"', {
				'cflags': [
					'-fPIC'
				],
				'libraries': [
					'-lpam'
				],
			}],
		],
    },
  ] # end targets
}

