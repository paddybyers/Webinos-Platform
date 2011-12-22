{
  'variables': {
    'module_name': 'node-sqlite3',#Specify the module name here
	#you may override the variables found in node_module.gypi here or through command line
	'output_directory': 'lib',
  },
  'targets': [
    {
	   # Needed declarations for the target
	   'target_name': '<(module_name)',
	   'product_name':'<(module_name)',
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
    },
  ] # end targets
}

