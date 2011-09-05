#include "CryptoManager_Qt.h"


CryptoManager_Qt::CryptoManager_Qt(){}

CryptoManager_Qt::~CryptoManager_Qt(){}

vector<string>& CryptoManager_Qt::getSignaturePaths(const QString & widgetRootPath){
	QMap<int,QString> map;
	int pos = 0;
	QRegExp rx("signature[1-9][0-9]*.xml");
	QRegExpValidator v(rx, this);

	QDirIterator it(widgetRootPath, QDir::Files,QDirIterator::Subdirectories);
	QString name,path;
	string author_signature;
	QFileInfo * info;
	bool b;
	int x,y;
	while (it.hasNext()) {	
		info = new QFileInfo(it.next());
		name = info->fileName();
		path = info->absoluteFilePath();
		if(v.validate(name,pos) == QValidator::Acceptable){ 		
			x = path.lastIndexOf("signature") + QString("signature").size();
			y = path.lastIndexOf(".");
			map.insert(path.mid(x,y-x).toInt(&b),path);			
		}
		else if(name=="author-signature.xml")
			author_signature = path.toStdString();
	}
	vector<string> * list = new vector<string>();
	if(author_signature != "")
		list->push_back(author_signature);
	QMapIterator<int, QString> it2(map);
	while (it2.hasNext()){
		it2.next();
		list->push_back(it2.value().toStdString());
	}
	return *list;
	
}


bool CryptoManager_Qt::validateAllSignatures(const string & widgetRootPath){
	vector<string> tmp_vet = getSignaturePaths(QString::fromStdString(widgetRootPath));
	return CryptoManager::validateAllSignatures(tmp_vet);
}

