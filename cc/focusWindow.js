function addFocusWindowMenu() {
	l('menu').insertBefore(new DOMParser().parseFromString('<div class="block" style="padding:0px;margin:8px 4px;"><div class="subsection" style="padding:0px;"><div class="title">Focus Window On:</div><div id="focusWindow" class="listing"></div></div>', "text/html").body.firstChild, l('menu').lastChild)
		
	appendChildToMenu('<a class="option smallFancyButton" onclick="focusLeft();PlaySound(\'snd/tick.mp3\');">The big cookie</a>', 'focusWindow')
	
	if(Game.Objects["Farm"].level != 0 && Game.ascensionMode == 0 && Game.Objects["Farm"].amount != 0) {
		appendChildToMenu('<a class="option smallFancyButton" onclick="focusFarm();PlaySound(\'snd/tick.mp3\');">The farm</a>', 'focusWindow')
	}
	if(Game.Objects["Bank"].level != 0 && Game.ascensionMode == 0 && Game.Objects["Bank"].amount != 0) {
		appendChildToMenu('<a class="option smallFancyButton" onclick="focusStockMarket();PlaySound(\'snd/tick.mp3\');">The stock market</a>', 'focusWindow')
	}
	if(Game.Objects["Temple"].level != 0 && Game.ascensionMode == 0 && Game.Objects["Temple"].amount != 0) {
		appendChildToMenu('<a class="option smallFancyButton" onclick="focusTemple();PlaySound(\'snd/tick.mp3\');">The pantheon</a>', 'focusWindow')
	}
}

function focusLeft() {
	Array.from(l('sectionRight').getElementsByTagName("*")).forEach(node => node.style.visibility='hidden')
	Array.from(l('sectionMiddle').getElementsByTagName("*")).forEach(node => node.style.visibility='hidden')
	l('rightBeam').style.visibility='hidden'
	l('leftBeam').style.visibility='hidden'
	l('sectionRight').style.visibility='hidden'
	l('sectionMiddle').style.visibility='hidden'
	l('sectionLeft').style.width='100%'
	l('backgroundLeftCanvas').style.width='100%'

	resize()
	
	l('productLevel0').style.visibility = 'hidden'
	
	l('versionNumber').onclick = function(){unFocusLeft();PlaySound('snd/tick.mp3');}
	l('versionNumber').style.visibility = 'visible'
	l('versionNumber').onmouseover = function(){l('versionNumber').style.color='#888888'};
	l('versionNumber').onmouseleave = function(){l('versionNumber').style.color='#ffffff'};
	
	window["focusedOn"] = "left"
}

function unFocusLeft() {
	Array.from(l('sectionRight').getElementsByTagName("*")).forEach(node => node.style.visibility='visible')
	Array.from(l('sectionMiddle').getElementsByTagName("*")).forEach(node => node.style.visibility='visible')
	l('rightBeam').style.visibility='visible'
	l('leftBeam').style.visibility='visible'
	l('sectionRight').style.visibility='visible'
	l('sectionMiddle').style.visibility='visible'
	l('sectionLeft').style.width=''
	l('backgroundLeftCanvas').style.width=''
	resize()
	
	l('productLevel0').style.visibility = 'visible'
	
	l('versionNumber').onclick = null
	l('versionNumber').onmouseover = null
	l('versionNumber').onmouseleave = null
	l('versionNumber').style.color='#ffffff'
	
	window["focusedOn"] = ""
}

function focusFarm() {
	closeMenu()
	
	window["miniGameOpen"] = Game.Objects["Farm"].onMinigame;
	Game.Objects["Farm"].switchMinigame(true)

    l('rightBeam').style.visibility='hidden'
    l('leftBeam').style.visibility='hidden'
    l('sectionRight').style.visibility='hidden'
    Array.from(l('sectionRight').getElementsByTagName("*")).forEach(node => node.style.visibility='hidden')
    Array.from(l('sectionMiddle').getElementsByTagName("*")).forEach(node => node.style.visibility='hidden')
	Array.from(l('sectionLeft').getElementsByTagName("*")).forEach(node => node.style.visibility='hidden')
    
    l('gardenBG').style.visibility='visible'
	l('gardenBG').style.width='100%'
	l('gardenBG').style.height=window.innerHeight
	l('gardenBG').style.position='fixed'
	l('gardenBG').style.top='0'
	l('gardenBG').style.left='0'

    Array.from(l('gardenContent').getElementsByTagName("*")).forEach(node => node.style.visibility='visible')
	l('gardenContent').style.width='100%'
	l('gardenContent').style.height=window.innerHeight
	l('gardenContent').style.position='fixed'
	l('gardenContent').style.top='0'
	l('gardenContent').style.left='0'
	
	resize()

	l('versionNumber').onclick = function(){unFocusFarm();PlaySound('snd/tick.mp3');}
	l('versionNumber').style.visibility = 'visible'
	l('versionNumber').onmouseover = function(){l('versionNumber').style.color='#888888'};
	l('versionNumber').onmouseleave = function(){l('versionNumber').style.color='#ffffff'};
	
	window["focusedOn"] = "farm"
}   
	   

function unFocusFarm() {
	l('rightBeam').style.visibility='visible'
    l('leftBeam').style.visibility='visible'
    l('sectionRight').style.visibility='visible'
    Array.from(l('sectionRight').getElementsByTagName("*")).forEach(node => node.style.visibility='visible')
    Array.from(l('sectionMiddle').getElementsByTagName("*")).forEach(node => node.style.visibility='visible')
	Array.from(l('sectionLeft').getElementsByTagName("*")).forEach(node => node.style.visibility='visible')
	
	l('gardenBG').style.width=''
	l('gardenBG').style.height=''
	l('gardenBG').style.position=''
	l('gardenBG').style.top=''
	l('gardenBG').style.left=''
	
	l('gardenContent').style.width=''
	l('gardenContent').style.height=''
	l('gardenContent').style.position=''
	l('gardenContent').style.top=''
	l('gardenContent').style.left=''
	
	l('gardenPlotSize').style.top=''
	l('gardenPlot').style.top=''
	l('gardenInfo').style.top=''
	
	resize()

	if(window["miniGameOpen"] == false) Game.Objects["Farm"].switchMinigame(0)
	
	l('versionNumber').onclick = null
	l('versionNumber').onmouseover = null
	l('versionNumber').onmouseleave = null
	l('versionNumber').style.color='#ffffff'
	
	openMenu()

	window["focusedOn"] = ""
}  

function focusStockMarket() {
	closeMenu()
	
	window["miniGameOpen"] = Game.Objects["Bank"].onMinigame;
	Game.Objects["Bank"].switchMinigame(1)
	
	l('rightBeam').style.visibility='hidden'
    l('leftBeam').style.visibility='hidden'
    l('sectionRight').style.visibility='hidden'
    Array.from(l('sectionRight').getElementsByTagName("*")).forEach(node => node.style.visibility='hidden')
    Array.from(l('sectionMiddle').getElementsByTagName("*")).forEach(node => node.style.visibility='hidden')
	Array.from(l('sectionLeft').getElementsByTagName("*")).forEach(node => node.style.visibility='hidden')
	
	l('bankBG').style.visibility='visible'
	Array.from(l('bankContent').getElementsByTagName("*")).forEach(node => node.style.visibility='visible')
	
	l('bankBG').style.visibility='visible'
	l('bankBG').style.width='100%'
	l('bankBG').style.height=window.innerHeight
	l('bankBG').style.position='fixed'
	l('bankBG').style.top='0'
	l('bankBG').style.left='0'
	
    Array.from(l('bankContent').getElementsByTagName("*")).forEach(node => node.style.visibility='visible')
	l('bankContent').style.width='100%'
	l('bankContent').style.height=window.innerHeight
	l('bankContent').style.position='fixed'
	l('bankContent').style.top='0'
	l('bankContent').style.left='0'
	
	resize()
	
	l('versionNumber').onclick = function(){unFocusStockMarket();PlaySound('snd/tick.mp3');}
	l('versionNumber').style.visibility = 'visible'
	l('versionNumber').onmouseover = function(){l('versionNumber').style.color='#888888'};
	l('versionNumber').onmouseleave = function(){l('versionNumber').style.color='#ffffff'};
	
	window["focusedOn"] = 'stockMarket'
}

function unFocusStockMarket() {	
	l('rightBeam').style.visibility='visible'
    l('leftBeam').style.visibility='visible'
    l('sectionRight').style.visibility='visible'
    Array.from(l('sectionRight').getElementsByTagName("*")).forEach(node => node.style.visibility='visible')
    Array.from(l('sectionMiddle').getElementsByTagName("*")).forEach(node => node.style.visibility='visible')
	Array.from(l('sectionLeft').getElementsByTagName("*")).forEach(node => node.style.visibility='visible')
	
	l('bankBG').style.width=''
	l('bankBG').style.height=''
	l('bankBG').style.position=''
	l('bankBG').style.top=''
	l('bankBG').style.left=''
	
	Array.from(l('bankContent').getElementsByTagName("*")).forEach(node => node.style.visibility='visible')
	l('bankContent').style.width=''
	l('bankContent').style.height=''
	l('bankContent').style.position=''
	l('bankContent').style.top=''
	l('bankContent').style.left=''
	
	resize()
	
	if(window["miniGameOpen"] == false) Game.Objects["Bank"].switchMinigame(0)
	
	l('versionNumber').onclick = null
	l('versionNumber').onmouseover = null
	l('versionNumber').onmouseleave = null
	l('versionNumber').style.color='#ffffff'
	
	openMenu()
	
	window["focusedOn"] = ""
}

function focusTemple() {
	closeMenu()
	
	window["miniGameOpen"] = Game.Objects["Temple"].onMinigame;
	Game.Objects["Temple"].switchMinigame(1)
	
    l('rightBeam').style.visibility='hidden'
    l('leftBeam').style.visibility='hidden'
    l('sectionRight').style.visibility='hidden'
    Array.from(l('sectionRight').getElementsByTagName("*")).forEach(node => node.style.visibility='hidden')
    Array.from(l('sectionMiddle').getElementsByTagName("*")).forEach(node => node.style.visibility='hidden')
	Array.from(l('sectionLeft').getElementsByTagName("*")).forEach(node => node.style.visibility='hidden')
	
	l('templeBG').style.visibility='visible'
	l('templeBG').style.width='100%'
	l('templeBG').style.height=window.innerHeight
	l('templeBG').style.position='fixed'
	l('templeBG').style.top='0'
	l('templeBG').style.left='0'
	
	Array.from(l('templeContent').getElementsByTagName("*")).forEach(node => node.style.visibility='visible')
	l('templeContent').style.width='100%'
	l('templeContent').style.height=window.innerHeight
	l('templeContent').style.position='fixed'
	l('templeContent').style.top='0'
	l('templeContent').style.left='0'
	
	resize()
	
	l('versionNumber').onclick = function(){unFocusTemple();PlaySound('snd/tick.mp3');}
	l('versionNumber').style.visibility = 'visible'
	l('versionNumber').onmouseover = function(){l('versionNumber').style.color='#888888'};
	l('versionNumber').onmouseleave = function(){l('versionNumber').style.color='#ffffff'};
	
	window["focusedOn"] = "temple"
}

function unFocusTemple() {	
	l('rightBeam').style.visibility='visible'
    l('leftBeam').style.visibility='visible'
    l('sectionRight').style.visibility='visible'
    Array.from(l('sectionRight').getElementsByTagName("*")).forEach(node => node.style.visibility='visible')
    Array.from(l('sectionMiddle').getElementsByTagName("*")).forEach(node => node.style.visibility='visible')
	Array.from(l('sectionLeft').getElementsByTagName("*")).forEach(node => node.style.visibility='visible')
	
	l('templeBG').style.width=''
	l('templeBG').style.height=''
	l('templeBG').style.position=''
	l('templeBG').style.top=''
	l('templeBG').style.left=''
	
	l('templeContent').style.width=''
	l('templeContent').style.height=''
	l('templeContent').style.position=''
	l('templeContent').style.top=''
	l('templeContent').style.left=''
	
	resize()
	
	if(window["miniGameOpen"] == false) Game.Objects["Bank"].switchMinigame(0)
	
	l('versionNumber').onclick = null
	l('versionNumber').onmouseover = null
	l('versionNumber').onmouseleave = null
	l('versionNumber').style.color='#ffffff'
	
	openMenu()
	
	window["focusedOn"] = ""
}

function resize() {
	Game.resize();
	Game.Background.canvas.width=Game.Background.canvas.parentNode.offsetWidth;
	Game.Background.canvas.height=Game.Background.canvas.parentNode.offsetHeight;
	Game.LeftBackground.canvas.width=Game.LeftBackground.canvas.parentNode.offsetWidth;
	Game.LeftBackground.canvas.height=Game.LeftBackground.canvas.parentNode.offsetHeight;
}

function closeMenu() {
	Game.removeClass('onMenu')
	Game.onMenu=''
	l('prefsButton').className='panelButton'
	Game.UpdateMenu();
	for (var i in Game.Objects)
	{
		var me=Game.Objects[i];
		if (me.minigame && me.minigame.onResize) me.minigame.onResize();
	}
}

function openMenu() {
	Game.addClass('onMenu');
	Game.onMenu='prefs'
	l('prefsButton').className='panelButton selected'
	Game.UpdateMenu();
}