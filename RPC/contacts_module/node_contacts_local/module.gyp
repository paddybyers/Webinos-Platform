{
  'variables': {
    #Specify the module name here
    'module_name': 'localcontacts',
  },
  'targets': [
    {
	  # Needed declarations for the target
	  'target_name': '<(module_name)',
	  'product_name':'<(module_name)',
	  
      'sources': [
        'src/MorkAddressBook.cpp',
		'src/MorkParser.cpp',
		'src/node_contacts_mork.cpp',
      ],
    },
  ] # end targets
}

