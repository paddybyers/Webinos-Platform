{
  'variables': {
    'module_name': 'localcontacts',#Specify the module name here
	#you may override the variables found in node_module.gypi here or through command line
  },
  'targets': [
    {
		'sources': [ #Specify your source files here
			'thunderbird_AB_parser/MorkAddressBook.cpp',
			'../contrib/MorkParser.cpp',
			'thunderbird_AB_parser/node_contacts_mork.cpp',
		],
		'include_dirs': [
		   '../contrib',
		],
		
		'includes': [ #This files loads all the required conditional staff for mac linux windows etc
			# Don't forget to update the following to point to the node_module.gypi
			'../../../../Tools/gyp_tools/node_module.gypi',
		],
    },
  ] # end targets
}

