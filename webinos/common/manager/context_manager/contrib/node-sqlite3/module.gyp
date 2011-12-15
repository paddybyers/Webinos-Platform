{
  'variables': {
    'module_name': 'node-sqlite3',#Specify the module name here
	#you may override the variables found in node_module.gypi here or through command line
	'output_directory': 'lib',
  },
  'targets': [
    {
		'sources': [ #Specify your source files here
			'deps/sqlite3/sqlite3.c',
			'src/database.cc',
			'src/node_sqlite3.cc',
			'src/statement.cc'
		],
		'include_dirs': [
		   'deps/sqlite3/',
		   'src/',
		],
		'includes': [ #This files loads all the required conditional staff for mac linux windows etc
			# Don't forget to update the following to point to the node_module.gypi
			'../../../../../../Tools/gyp_tools/node_module.gypi',
		],
    },
  ] # end targets
}

