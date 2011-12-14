{
  'variables': {
    'module_name': 'pm',#Specify the module name here
	#you may override the variables found in node_module.gypi here or through command line
  },
  'targets': [
    {
		'sources': [ #Specify your source files here
			"pm.cc",
			"core/policymanager/PolicyManager.cpp",
			"core/policymanager/Condition.cpp",
			"core/policymanager/Globals.cpp",
			"core/policymanager/IPolicyBase.cpp",
			"core/policymanager/Policy.cpp",
			"core/policymanager/PolicySet.cpp",
			"core/policymanager/Request.cpp",
			"core/policymanager/Rule.cpp",
			"core/policymanager/Subject.cpp",
			"core/common.cpp",
			"../contrib/xmltools/tinyxml.cpp",
			"../contrib/xmltools/slre.cpp",
			"../contrib/xmltools/tinystr.cpp",
			"../contrib/xmltools/tinyxmlparser.cpp",
			"../contrib/xmltools/tinyxmlerror.cpp",
		],
		'include_dirs': [
		   'core/policymanager',
		   'core',
		],
		
		'includes': [ #This files loads all the required conditional staff for mac linux windows etc
			# Don't forget to update the following to point to the node_module.gypi
			'../../../../../Tools/gyp_tools/node_module.gypi',
		],
    },
  ] # end targets
}

