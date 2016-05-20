var rockpool = rockpool || {};

rockpool.currentSaveName = "Untitled"

rockpool.saveDialog = function(){

	var dom_container = $('<div class="save-load palette"><i class="close"></i><header><h1>save your pool</h1></header><div class="saves">');
	
	dom_container.find('.saves').append('<div class="choices"><p>give it a name</p><input type="text" value="' + rockpool.currentSaveName + '"><i class="add"></i></div>');

	rockpool.prompt(dom_container,false);

	dom_container.on('click','.choices i',function(e){
		e.preventDefault();
		e.stopPropagation();

		var name = dom_container.find('.choices input').val();

		rockpool.saveCurrentState(name);

		rockpool.closePrompt();
		dom_container.remove();
	});

}

rockpool.loadDialog = function(){

	var dom_container = $('<div class="save-load palette"><i class="close"></i><header><h1>load a pool</h1></header><div class="saves"><ul class="save-list">');
	var dom_saves = dom_container.find('.save-list');
	var saves = rockpool.saveListLoad();
	for(idx in saves){
		var save = saves[idx];
		var dom_save = $('<li class="active"><i class="icon-peek"></i><span></span><i class="delete"></i>').data('save',save);
		dom_save.find('span').text(save.replace('_',' '));
		dom_save.appendTo(dom_saves);
	}

	rockpool.prompt(dom_container,false);

	dom_container.on('click','.active',function(e){
		e.preventDefault();
		e.stopPropagation();
		var save = $(this).data('save');
        rockpool.clear();
        rockpool.loadState(save);
        rockpool.closePrompt();
        dom_container.remove();
	})
	.on('click','.delete',function(e){
		e.preventDefault();
		e.stopPropagation();

		$(this).removeClass('delete').addClass('confirm');

	})
	.on('click','.confirm',function(e){
		e.preventDefault();
		e.stopPropagation();

		var save = $(this).parents('li').data('save');
        rockpool.saveDelete(save);
		$(this).parents('li').remove();

	})
	;

}

rockpool.loadFromFile = function(file_name){
	$.ajax({
		url: "/saves/" + file_name + ".json",
		dataType: "json",
		success: function(data){
			rockpool.clear();
			rockpool.deserialize(data);
		},
		error: function(obj,error_text){
			console.log(error_text);
		}
	});

}

rockpool.deserialize = function(source){
    if( typeof(source) === 'string' ){
        source = JSON.parse(source);
    }

    for( var x = 0; x < source.length; x++ ){
        var temp = new rockpool.rule(source[x]);
    }
}

rockpool.serialize = function(){
    var rules = [];
    rockpool.forRules(function(rule){
        rules.push(rule.serialize())
    });
    return '[' + rules.join(',') + ']';
}

rockpool.delPersistentValue = function(key){
    localStorage.removeItem(key);
}

rockpool.getPersistentValue = function(key, default_value){
    if( key in localStorage ){
        return localStorage[key];
    }
    return default_value;
}

rockpool.setPersistentValue = function(key, value){
    localStorage.setItem(key, value);
}

rockpool.saveListLoad = function(){

    var saves = rockpool.getPersistentValue('save_index_1',[]);

    if( typeof(saves) === "string" ){
	    try{
	    	saves = JSON.parse(saves);
		}
		catch(e){
	        saves = []
		}
	}

    return saves;

}

rockpool.saveListSave = function(list){

	list = JSON.stringify(list); //list.join(',');
	rockpool.setPersistentValue('save_index_1',list)

}

rockpool.saveLoad = function(id){

	id = id.toLowerCase().replace(' ','_');

	var save = rockpool.getPersistentValue('save_1_' + id, null);

	if( save != null ){
		return save;
		save = JSON.parse(save);
	}

	return null;

}

rockpool.saveSave = function(title, data){

	var id = title.toLowerCase().replace(' ','_');

	if( typeof(data) !== "string" ){
		data = JSON.stringify(data);
	}

	var savelist = rockpool.saveListLoad();

	if( savelist.indexOf(id) == -1 ){
		savelist.push(id);
		rockpool.saveListSave(savelist);
	}

	rockpool.setPersistentValue('save_1_' + id, data);

}

rockpool.saveDelete = function(id){

	id = id.toLowerCase().replace(' ','_');

	var savelist = rockpool.saveListLoad();
	var idx;

	if( (idx = savelist.indexOf(id)) >-1 ){
		savelist.splice(idx,1);
		rockpool.saveListSave(savelist);
		rockpool.delPersistentValue('save_1_' + id);
	}

}

rockpool.loadState = function(name){

	var data = rockpool.saveLoad(name);
	if( data != null ){
		rockpool.currentSaveName = name.replace('_',' ');
		rockpool.deserialize(data);
	}

}

rockpool.saveCurrentState = function(name){

	var data = rockpool.serialize();
	rockpool.saveSave(name, data);

}