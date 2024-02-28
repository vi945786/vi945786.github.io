function changePantheon(element) {
	fetchHtml(element.src).then(str => {
	
		str = str.replace("AddEvent(l('templeGodDrag'+me.id),'mousedown',function(what){return function(e){if (e.button==0){M.dragGod(what);}}}(me));\n\t\t\tAddEvent(l('templeGodDrag'+me.id),'mouseup',function(what){return function(e){if (e.button==0){M.dropGod(what);}}}(me));", "changeTempleDrag(me, M)")
		
		element.src=''
		element.text=str
		
		appendScript(element, document.head);
		Game.scriptLoaded(Game.ObjectsById[6], null)
	})
	
	return element;
}

function changeTempleDrag(me, M) {
	
	AddEvent(l('templeGodDrag'+me.id),'click', function(e) {
	
		if(e.which!=1 || window["focusedOn"] != "temple")return;
		
		if(me['toggled']) {
			M.dragGod(me);
		} else {
			M.dragGod(me);
		} 
		me['toggled'] = !me['toggled']
	
	})
	AddEvent(l('templeGodDrag'+me.id),'mousedown',function(what){return function(e){if (e.button==0&&window["focusedOn"]!="temple"){M.dragGod(what);}}}(me));
	AddEvent(l('templeGodDrag'+me.id),'mouseup',function(what){return function(e){if (e.button==0&&window["focusedOn"]!="temple"){M.dropGod(what);}}}(me));
	
}