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
		
		appendChildToMenu('<a class="option smallFancyButton" onclick="Game.CollectWrinklers();PlaySound(\'snd/tick.mp3\');">Explodes All Wrinklers</a>', 'Utils')
		appendChildToMenu('<a class="option smallFancyButton" onclick="Game.WriteSave();Game.ExportSave();PlaySound(\'snd/tick.mp3\');">Export Same</a>', 'Utils')
		
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

function replaceAtEnd() {
	var str = Game.Init.toString();
	
	var end = "";
	end += "TopBarOffset = 0;"
	end += "l('topBar').parentNode.removeChild(l('topBar'));"
	end += "l('game').style.top = 0;"
	end += "resize();"
	
	Game.Init = eval("(" + str.slice(0, -1) + end + "})")
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
		str = str.replace('Look on the purple flag at the top to see how many heralds are active at any given time', 'Look at \\"General\\" section of the statistics page to see how many heralds are active at any given time')
		
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