/*******************************************************************************
*  Code contributed to the webinos project
* 
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*  
*     http://www.apache.org/licenses/LICENSE-2.0
*  
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
* 
* Copyright 2011 Impleo Ltd
******************************************************************************/
var ANSI_CODES = {
  "off": 0,
  "bold": 1,
  "italic": 3,
  "underline": 4,
  "blink": 5,
  "inverse": 7,
  "hidden": 8,
  "black": 30,
  "red": 31,
  "green": 32,
  "yellow": 33,
  "blue": 34,
  "magenta": 35,
  "cyan": 36,
  "white": 37,
  "black_bg": 40,
  "red_bg": 41,
  "green_bg": 42,
  "yellow_bg": 43,
  "blue_bg": 44,
  "magenta_bg": 45,
  "cyan_bg": 46,
  "white_bg": 47
};

console._log = console.log;

console.logcolor = function(str, color) {
  if(!color) {console._log(str); return;}

  var color_attrs = color.split("+");
  var ansi_str = "";
  for(var i=0, attr; attr = color_attrs[i]; i++) {
    ansi_str += "\033[" + ANSI_CODES[attr] + "m";
  }
  ansi_str += str + "\033[" + ANSI_CODES["off"] + "m";
  console._log(ansi_str);
};

var ASCII_ARTS = {
  "finger": function(str,color){
		console.logcolor("          ____________",color);
		console.logcolor("....-''``'._ _________) " + str,color);
		console.logcolor("        ,_  '-.___)",color);
		console.logcolor("          `'-._)_)",color);
		console.logcolor("-----'``\"-,__(__)",color);
	},
  "fire": function(str,color){
		console.logcolor("     (     ",color);
		console.logcolor("   .) )    ",color);
		console.logcolor("  `(,' (,  ",color);
		console.logcolor("  ). (, (' " + str,color);
		console.logcolor(" ( ) ; ' ) ",color);
		console.logcolor(" ')_,_)_(` ",color);
  }
};

console.log = function(str, color, art){
  if (!art) {console.logcolor(str,color); return;}
  if(ASCII_ARTS[art])
	ASCII_ARTS[art](str,color);
  else
    console.logcolor(str,color);
};



