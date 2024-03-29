(async function() { 
	var doc = await getDoc();
	
	doc.head.innerHTML = doc.head.innerHTML.replaceAll("url(img/", "url(https://orteil.dashnet.org/cookieclicker/img/").replaceAll("file", "https");
	doc.body.innerHTML = doc.body.innerHTML.replaceAll("url(img/", "url(https://orteil.dashnet.org/cookieclicker/img/").replaceAll("file", "https");

	Array.prototype.slice.call(doc.getElementsByClassName("adBanner")).forEach(ad => {
		ad.parentNode.removeChild(ad);
	});
	
	Array.prototype.slice.call(doc.getElementsByClassName("ad")).forEach(ad => {
		ad.parentNode.removeChild(ad);
	});
	
	Array.prototype.slice.call(doc.getElementsByClassName("ifNoAds")).forEach(ad => {
		ad.parentNode.removeChild(ad);
	});
	
	document.head.innerHTML = "";
	document.body.innerHTML = "";
	
	Array.prototype.slice.call(doc.body.childNodes).forEach(element => {
		if(element.tagName === "SCRIPT") {
			appendScript(element, document.body);
		} else {
			document.body.appendChild(element);
		}
	})
	
	Array.prototype.slice.call(doc.head.childNodes).forEach(element => {
		if(element.tagName === "SCRIPT") {
			appendScript(element, document.head);
		} else {
			document.head.appendChild(element);
		}
	})
	
	checkGame();
	checkLinks();
	autoSave();
})();

function saveButton() {
	saved++;
	var saveCode = save()
	if(useAPI) {
		db.publish('SAVE', {'game': saveCode}, function(error, result) {})
	}
}

function loadButton() {
	saveFile.reload(function(err, res) {
		saveFile = res;
		Game.CloseNotes()
		Game.ImportSaveCode(saveFile.savefile.game)
	})
}

function save() {
	var saveCode = getSave();
	if(useAPI) {
		saveFile.savefile.game = saveCode;
		saveFile.save();
	}
	return saveCode;
}

var fixAjax=function(url, callback) {
  if (!url.startsWith("http")) url = "https://orteil.dashnet.org" + url;

  if (url.indexOf('?')==-1) url+='?'; else url+='&';
  url += 'nocache=' + Date.now();

  fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`)
    .then(response => response.text())
    .then(data => callback(data));
}

var fixAddEvent=function(el,ev,func) {
	if(!el) return;
	if (el.addEventListener) {el.addEventListener(ev,func,false);return [el,ev,func];}
	else if (el.attachEvent) {var func2=function(){func.call(el);};el.attachEvent('on'+ev,func2);return [el,ev,func2];}
	return false;
}

function appendChildToMenu(child, menu) {
	l(menu).appendChild(new DOMParser().parseFromString(child, "text/html").body.firstChild)
	l(menu).appendChild(document.createElement('br'))
}

function replaceMenu() {
	if(Game.onMenu=='prefs') {
		if(Game.Has('Wrapping paper') && Game.ascensionMode == 0) {
			l('menu').childNodes[3].childNodes[0].childNodes[0].append(l('giftStuff'));
		}
		
		l('menu').removeChild(l('menu').getElementsByClassName('block')[0]);
		 
		addFocusWindowMenu();
		
		//addUtilsMenu
		l('menu').insertBefore(new DOMParser().parseFromString('<div class="block" style="padding:0px;margin:8px 4px;"><div class="subsection" style="padding:0px;"><div class="title">Utils</div><div id="Utils" class="listing"></div></div>', "text/html").body.firstChild, l('menu').lastChild)
		
		appendChildToMenu('<a class="option smallFancyButton" onclick="Game.CollectWrinklers();PlaySound(\'snd/tick.mp3\');">Pops all wrinklers</a>', 'Utils')
		appendChildToMenu('<a class="option smallFancyButton" onclick="Game.WriteSave();Game.ExportSave();PlaySound(\'snd/tick.mp3\');">Export save</a>', 'Utils')
		
	}else if(Game.onMenu=='stats'){
		var saveButton = document.createElement('div');
		saveButton.innerHTML = 'save';
		saveButton.style.fontSize=20;
		saveButton.onclick = window['saveButton'];
		saveButton.onmouseover=function(){saveButton.style.color='#888888'};
		saveButton.onmouseleave=function(){saveButton.style.color='#ffffff'};
		var div=document.createElement('div');
		div.appendChild(saveButton);
		div.style='display:flex;justify-content:center;align-items:center';
		l('menu').childNodes[1].insertBefore(div, l('menu').childNodes[1].firstChild);
		
		var loadButton = document.createElement('div');
		loadButton.innerHTML = 'load';
		loadButton.style.fontSize=20;
		loadButton.onclick = window['loadButton'];
		loadButton.onmouseover=function(){(loadButton.style.color='#888888')};
		loadButton.onmouseleave=function(){(loadButton.style.color='#ffffff')};
		div=document.createElement('div');
		div.appendChild(loadButton);
		div.style='display:flex;justify-content:center;align-items:center';l('menu').childNodes[1].appendChild(div);
		
		var div = document.createElement("div")
		div.className = "listing"
		div.innerHTML = "<b>Heralds:</b> " + Game.heralds
		l('menu').childNodes[2].childNodes[1].appendChild(div)
	}
}

function getMaxBulkBuy(object) {
	if(object.getSumPrice(1) > Game.cookies) return 0;
	var lastI = 0;
	var i = 1;
	while(object.getSumPrice(i) <= Game.cookies) {
		lastI = i;
		i *= 2;
	}
	while(!(object.getSumPrice(i) <= Game.cookies && object.getSumPrice(i+1) > Game.cookies)) {
		if(object.getSumPrice(i) > Game.cookies) {
			var tempI = i
			i -= Math.round((Math.max(i,lastI) - Math.min(i,lastI))/2)
			lastI = tempI;
		} else {
			var tempI = i
			i += Math.round((Math.max(i,lastI) - Math.min(i,lastI))/2)
			lastI = tempI;
		}
	}
	return i;
}

function replaceAtEnd() {
	var end = "";
	end += "TopBarOffset = 0;"
	end += "l('topBar').parentNode.removeChild(l('topBar'));"
	end += "l('game').style.top = 0;"
	end += "resize();"
	end += "\n(" + 
	
	(function() {
		for(var i = 0;i < Game.ObjectsN;i++) {
			Game.ObjectsById[i].buy=function(amount) {
				if (Game.buyMode==-1) {this.sell(Game.buyBulk,1);return 0;}
				if (!amount) amount=Game.buyBulk;
				if (amount==-1) {
					amount = getMaxBulkBuy(this);
				}
				if(this.bulkPrice > Game.cookies) return;
				Game.Spend(this.bulkPrice);
				this.amount += amount;
				this.bought += amount;
				if (this.buyFunction) this.buyFunction();
				Game.recalculateGains=1;
				if (this.amount==1 && this.id!=0) l('row'+this.id).classList.add('enabled');
				this.highest=Math.max(this.highest,this.amount);
				Game.BuildingsOwned += amount;
				PlaySound('snd/buy'+choose([1,2,3,4])+'.mp3',0.75);this.refresh();
			}
			Game.ObjectsById[i].refresh=function() {
				this.price=this.getPrice();
				var amount = Game.buyBulk;
				if (amount==-1) amount = getMaxBulkBuy(this);
				if (Game.buyMode==1) this.bulkPrice=this.getSumPrice(amount);
				else if (Game.buyMode==-1) this.bulkPrice=this.getReverseSumPrice(amount);
				this.rebuild();
				if (this.amount==0 && this.id!=0) l('row'+this.id).classList.remove('enabled');
				else if (this.amount>0 && this.id!=0) l('row'+this.id).classList.add('enabled');
				if (this.muted>0 && this.id!=0) {l('row'+this.id).classList.add('muted');l('mutedProduct'+this.id).style.display='inline-block';}
				else if (this.id!=0) {l('row'+this.id).classList.remove('muted');l('mutedProduct'+this.id).style.display='none';}
			}
		}
	}).toString() + ")()";
		
	Game.Init = eval("(" + Game.Init.toString().slice(0, -1) + end + "})")
}

function checkGame() {
    try {
		Game.resPath='https://cdn.dashnet.org/cookieclicker/';
		Game.local = false;
		ajax = fixAjax;
		AddEvent = fixAddEvent;
		
		l('bigCookie').addEventListener('contextmenu', event => {l('bigCookie').click();return event.preventDefault()});
		l('support').parentNode.removeChild(l('support'));
		
		str = Game.Launch.toString();
		str = str.replaceAll('url(img/', "url(https://orteil.dashnet.org/cookieclicker/img/"); //fixes most the images
		str = str.replace("this.domain='';", "this.domain='https://orteil.dashnet.org/cookieclicker/img/';") //fixes more image problems
		str = str.replace("Game.toSave=true;e.preventDefault();", ""); //prevents ctrl+s to save (to prevent spamming the api)
		str = str.replace('Game.toSave=true', "save()"); //makes the game save to the server everytime it saves for any reason
		str = str.replaceAll("Game.prefs.autosave=", "//"); //removes autosaves (a diffrent implementation is used)
		str = str.replace("|| now-Game.lastClick<1000/((e?e.detail:1)===0?3:50)", ""); //removes security against faking a click event on the cookie using code (there is some code that turns right click to left click for when i'm playing on my laptop)
		str = str.replace("l('menu').innerHTML=str;", "l('menu').innerHTML=str;window['replaceMenu'].call()"); //changes the menu (see replaceMenu())
		str = str.replace("if (!quick) quick=6;", "if (!quick) quick=6;if(title == 'Achievement unlocked') quick=0") //makes achievement notifications stay forever even on short notifications mode
		str = str.replace("quick=Math.min(6,quick)", "quick=Math.min(3,quick)") //makes notifications disappear even faster on short notifications mode
		str = str.replace("l('versionNumber').innerHTML='v. '+Game.version", "l('versionNumber').innerHTML='v. '+Game.version//"); //removes the lock icon next to the version number ()
		str = str.replace('Look on the purple flag at the top to see how many heralds are active at any given time', 'Look at \\"General\\" section of the statistics page to see how many heralds are active at any given time');
		str = str.replace("l('storeBulkMax').style.visibility='hidden", "l('storeBulkMax').style.visibility='visible");
		str = str.replace('loc("all")', '"max"');
		str = str.replace("if (Game.buyMode==1 && Game.buyBulk==-1)", "//");
		str = str.replace("(Game.buyBulk>1)?('x'+Game.buyBulk+' '):''", "'x' + ((Game.buyBulk!=-1)?(Game.buyBulk):((Game.buyMode==1)?(getMaxBulkBuy(this)):(me.amount))) + ' '");
		str = str.replaceAll('(Game.buyMode==1 && Game.cookies>=price) || (Game.buyMode==-1 && me.amount>0)', '(Game.buyBulk==-1)?(me.getSumPrice(1)<=Game.cookies):((Game.buyMode==1&&Game.cookies>=price)||(Game.buyMode==-1&&me.amount>0))');
		str = str.replace("if (Game.keys[17]) Game.buyBulk=10;", "if (Game.keys[17]) Game.buyBulk=10;if (Game.keys[18]) Game.buyBulk=-1;");
		str = str.replace("Game.keys[16] || Game.keys[17]", "Game.keys[16] || Game.keys[17] || Game.keys[18]");
		str = str.replace("!Game.keys[16] && !Game.keys[17]", "!Game.keys[16] && !Game.keys[17] && !Game.keys[18]");
		str = str.replace("%1 to bulk-buy or sell %2 of a building at a time, or %3 for %4", "<b>Ctrl</b> to bulk-buy or sell <b>10</b> of a building at a time, or <b>Shift</b> for <b>100</b> and <b>Alt</b> for <b>max</b>")
		
		var end = "";
		end += "replaceAtEnd()"
		
		Game.Launch = eval("(" + str.slice(0, -1) + end + "})");
		
		if(useAPI) {
			localStorageSet("CookieClickerLang", "EN")
			new db.gamesaver.find({}, {}, function(err, res) {
				saveFile = res[0];
				localStorageSet("CookieClickerGame", saveFile.savefile.game)
				window.onload();
			})
		} else {
			window.onload();
		}

		
	} catch(error) {
		window.setTimeout(checkGame, 100);
	}
}

async function getDoc() {
	var html = await fetchHtml('https://orteil.dashnet.org/cookieclicker')
	
	const parser = new DOMParser();
	var doc = parser.parseFromString(html, "text/html")
	
	var docHead = parser.parseFromString(html.split("head>")[1].slice(0, -2), "text/html")
	
	Array.prototype.slice.call(docHead.body.childNodes).forEach(element => {
		docHead.head.append(element)
	})
	
	var docBody = parser.parseFromString(html.split("body>")[1].slice(0, -2), "text/html")
	
	Array.prototype.slice.call(docBody.head.childNodes).forEach(element => {
		docBody.body.append(element)
	})
	
	doc.head.innerHTML = docHead.head.innerHTML;
	doc.body.innerHTML = docBody.body.innerHTML;
	
	return doc;
}

function appendScript(element, parentNode) {
	var scriptType = element.text=='' ? "src" : "innerHTML";
	var scriptContent = element[scriptType];
	if(scriptType == "src" && scriptContent.includes("ad")) return;
	
	var script = document.createElement("script");
	script[scriptType] = scriptContent.replace(currentUrl, "https://orteil.dashnet.org/cookieclicker").replace("file", "https");
	script.id = element.id;
	parentNode.append(script);
}