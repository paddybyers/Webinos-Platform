/*
 * SecurityManager_Qt.h
 *
 *  Created on: 13/nov/2010
 *      Author: Giuseppe La Torre
 */

#ifndef SECURITYMANAGER_QT_H_
#define SECURITYMANAGER_QT_H_

#include "SecurityManager.h"
#include "crypto/CryptoManager_Qt.h"
#include "Dialog/BondiDialog.h"
#include <QWidget>
#include <QMessageBox>

class SecurityManager_Qt : public SecurityManager
	{
Q_OBJECT
private:
	BondiDialog  * dialog;
	void setCryptoManagerInstance();

public:
	SecurityManager_Qt();
	virtual ~SecurityManager_Qt();
	Action promptToUser(Effect,map<string, vector<string>*>&);	

	bool check_INSTALL(Request *) ;										// at install time
	EvalResponse check_LOAD(Request *) ;									// at load time
	bool check_INVOKE(Request *) ;										// at execution time

	bool handleEffect(Effect effect, Request * req);
	
	void setCryptoManagerInstance() ;
	Action promptToUser(Effect,map<string, vector<string>*>&) ;
	bool handleEffect(Effect, Request*) ;
	
private slots:
	void manageDialog();
	};

#endif /* SECURITYMANAGER_QT_H_ */
