/*
 * BondiDebug.h
 *
 *  Created on: 12/nov/2010
 *      Author: Giuseppe La Torre
 */

#ifndef BONDIDEBUG_H_
#define BONDIDEBUG_H_

#include "core/Environment.h"
#define debug_token "@[QtBondi] "

#ifdef ENABLE_DEBUG
	#ifdef QT
		#include <QDebug>
		#define LOG(mess)	qDebug() << debug_token << mess 
	#endif
	#ifdef JNI
		#define LOG(mess)
	#endif
#else
	#define LOG(mess)
#endif

#endif /* BONDIDEBUG_H_ */
