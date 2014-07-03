Dialog = function (context, socket) {
	
	this._context = context;
	this._socket = socket;
	this.setBehavior(new ChoosePhotoStyle(this));
	var
		source = $('#dialog-tpl').html(),
		compiledTemplate = Handlebars.compile(source),
		result = compiledTemplate(context);
	
	$(document.body).append(result);
	
	this._modal = $("#myModal").modal();
	this._carousel = $("#carousel-example-generic").carousel({interval:false});

	this.attachEvent();
};

Dialog.prototype.close = function () {
	this._modal.modal('hide')
}
Dialog.prototype.attachEvent = function () {
	var self = this;
	
	this._modal.on('hidden.bs.modal', function (e) {
		self._behavior.detachEvent();
		$('#myModal').remove();
		delete self;
	});
};

Dialog.prototype.uploadFile = function () {
	var self = this;
	this._context.imgtypes  = this._imgType;
        this._context.amount = this._printAmount;


	$.ajax({
		url: '/upload',
		type: 'POST',
		data: this._context
	}).done(function (data) {
		//window.alert('dior');
	     self.filename = data.filename;
	     //$('.yes-btn').prop('disabled', false).text("Yes");
	});
};

Dialog.prototype.sendMail = function (mail) {
	var self = this;
	$.ajax({
		url: '/sendmail',
        type: 'POST',
        data: {
        	mail: mail,
        	filename: self.filename
        }
	});
};
Dialog.prototype.uploadToDropbox = function(url) {
	var self = this;
	$.ajax({
		url: '/uploaddb',
        type: 'POST',
        data: {
        	url: self._context.url,
        	amount: self._printAmount
        }
	});
};
Dialog.prototype.sendLogMail = function (mail, name, address) {
	var self = this;
	$.ajax({
		url: '/logmail',
		type: 'POST',
		data: {
			mail: mail,
			name: name,
			address: address,
			filename: self.filename
		}
	});
};


Dialog.prototype._printPhoto = function() {
	popup = window.open();
	popup.document.write('<img src="'+this._context.url+'" />');
	popup.print();
};

/**
* 
*/
Dialog.prototype.setImgType = function (type) {
	this._imgType = type;
}

Dialog.prototype.setPrintAmount = function (amount) {
	this._printAmount = amount;
}


Dialog.prototype.setBehavior = function (behavior) {
	this._behavior = behavior ;
	this._behavior.attachEvent ();
}

Dialog.prototype.next = function (newbehavior) {
	this._carousel.carousel('next');
	this.setBehavior(newbehavior);
}
