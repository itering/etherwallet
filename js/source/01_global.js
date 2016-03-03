var PrivKey = "";
var decryptType = "";
var usdval;
var eurval;
var btcval;
(function($) {
	$.fn.extend({
		isChildOf: function(filter) {
			return $(filter).find(this).length > 0;
		}
	});
})(jQuery);
$(document).ready(function() {
	bindElements();
	checkAndLoadPageHash();
	checkAndRedirectHTTPS();
});

function checkAndRedirectHTTPS() {
	var host = "myetherwallet.com";
	var githost = "kvhnuke.github.io";
	var githostw = "www.kvhnuke.github.io";
	var hostw = "www.myetherwallet.com";
	if ((host == window.location.host || githost == window.location.host || hostw == window.location.host || githostw == window.location.host) && (window.location.protocol != "https:")) window.location.protocol = "https";
}

function checkAndLoadPageHash() {
	if (window.location.hash) {
		var phash = window.location.hash.substr(1);
		$(".ptabs").each(function(index) {
			if ($(this).attr('id') == phash) {
				$(this).click();
				setTimeout(function() {
					$('html,body').scrollTop(0);
				}, 50);
				return;
			}
		});
	}
}

function onTabOpen(tabid) {
	if (tabid == 'send-transaction') {
		onSendTransactionOpens();
	} else if (tabid == 'view-wallet-info') {
		onViewWalletOpens();
	} else if (tabid == 'offline-transaction') {
		onOfflineTxOpens();
	}
}

function onSendTransactionOpens() {
	resetDecryptValues();
	$("#walletselection").detach().appendTo($('#sendTransactionDecryptWallet'));
	$("#decryptdata").attr('onDecrypt', 'walletSendDecryptSuccess');
}

function onViewWalletOpens() {
	resetDecryptValues();
	$("#walletselection").detach().appendTo($('#viewDetailsDecryptWallet'));
	$("#decryptdata").attr('onDecrypt', 'walletViewDecryptSuccess');
}

function onOfflineTxOpens() {
	resetDecryptValues();
	$("#walletselection").detach().appendTo($('#sendOfflineTransactionDecryptWallet'));
	$("#decryptdata").attr('onDecrypt', 'offlineTxSuccess');
}

function paneNavigate(showEleId, activeEleId) {
	hideAllMainContainers();
	$("#" + showEleId).show();
	$("#" + activeEleId).parent().addClass('active');
	location.hash = activeEleId;
	onTabOpen(activeEleId);
	$('html,body').scrollTop(0);
}

function bindElements() {
	$(".ptabs").each(function(index) {
		$(this).click(function() {
			paneNavigate($(this).attr('showId'), this.id);
		});
	});
	$("#privkeyenc,#address,#privkey").click(function() {
		this.focus();
		this.select();
	});
	$("#btndonate").click(function() {
		$("#sendtxaddress").val('0x7cb57b5a97eabe94205c07890be4c1ad31e486a8');
		$("#donateThanks").show();
		$("#sendtxaddress").trigger("keyup");
	});
	$("#generatewallet").click(function() {
		generateSingleWallet();
	});
	$("#btngeneratetranaction").click(function() {
		preCreateTransaction();
	});
	$("#printqr").click(function() {
		printQRcode();
	});
	$("#btnapprovesend").click(function() {
		preSendTransaction();
	});
	$("#bulkgenerate").click(function() {
		generateBulkWallets();
	});
    $("#getAddressInfo").click(function() { 
		getAddressInfo();
	});
    $("#genSignedOfflineTx").click(function() { 
		genSignedOfflineTx();
	});
    $("#sendOfflineTx").click(function() { 
		sendOfflineTx();
	});
    $("#sendOfflineTxApprove").click(function() { 
		sendOfflineTxApprove();
	});
	$("#step1Collapse").click(function() {
		$("#step1Panel").slideToggle();
		if ($("#step1Collapse").html() == "-") {
			$("#step1Collapse").html("+");
		} else {
			$("#step1Collapse").html("-");
		}
	});
	$("#step2Collapse").click(function() {
		$("#step2Panel").slideToggle();
		if ($("#step2Collapse").html() == "-") {
			$("#step2Collapse").html("+");
		} else {
			$("#step2Collapse").html("-");
		}
	});
	$("#step3Collapse").click(function() {
		$("#step3Panel").slideToggle();
		if ($("#step3Collapse").html() == "-") {
			$("#step3Collapse").html("+");
		} else {
			$("#step3Collapse").html("-");
		}
	});
	$("#transferAllBalance").click(function() {
		getMaxSendAmount($("#accountAddress").html(), function(data) {
			$('#sendtxamount').val(data);
			$('input[type=radio][name=currencyRadio][value=ether]').prop("checked", true);
			$('#sendtxamount').trigger("keyup");
		}, function(err) {
			$("#txcreatestatus").html('<p class="text-center text-danger"><strong> ' + err + '</strong></p>').fadeIn(50).fadeOut(3000);
		});
	});
	$("#decryptdata").click(function() {
		$("#decryptStatus").html('<p class="text-center text-info"><strong> Please Wait...</strong></p>').fadeIn(10);
		setTimeout(function() {
			decryptFormData();
		}, 100);
	});
	$('input[type=radio][name=typeOfKeyRadio]').change(function() {
		resetDecryptValues();
		if (this.value == 'fileupload') {
			$("#selectedTypeKey").hide();
			$("#selectedUploadKey").show();
			decryptType = "fupload";
		} else if (this.value == 'pasteprivkey') {
			$("#selectedUploadKey").hide();
			$("#selectedTypeKey").show();
			decryptType = "privkey";
		}
	});
	$('#walletfilepassword').on('paste, keyup', function() {
		if ($('#walletfilepassword').val() != "") {
			$("#uploadbtntxt-wallet").show();
			$("#uploadbtntxt-privkey").hide();
			$("#walletuploadbutton").show();
		} else {
			$("#walletuploadbutton").hide();
		}
	});
	$('input[type=radio][name=currencyRadio]').change(function() {
		$("#sendtxamount").trigger("keyup");
	});
	$('#sendtxamount').on('paste, keyup', function() {
		var amount = $('#sendtxamount').val();
		if ($('#sendtxamount').val() != "" && $.isNumeric(amount) && amount > 0) {
			var etherUnit = $('input[type=radio][name=currencyRadio]:checked').val();
			$("#weiamount").html('<p class="text-success"><strong>' + toWei(amount, etherUnit) + ' wei ( approximately ' + toFiat(amount, etherUnit, usdval) + ' USD/' + toFiat(amount, etherUnit, eurval) + ' EUR )</strong></p>');
		} else if ($('#sendtxamount').val() != "" && !$.isNumeric(amount)) {
			$("#weiamount").html('<p class="text-danger"><strong>Invalid amount</strong></p>');
		} else {
			$("#weiamount").html('');
		}
	});
    
    $('input[type=radio][name=currencyRadioOffline]').change(function() {
		$("#offlineSendtxamount").trigger("keyup");
	});
	$('#offlineSendtxamount').on('paste, keyup', function() {
		var amount = $(this).val();
		if (amount != "" && $.isNumeric(amount) && amount > 0) {
			var etherUnit = $('input[type=radio][name=currencyRadioOffline]:checked').val();
			$("#offlineweiamount").html(getSuccessText(toWei(amount, etherUnit)+" wei"));
		} else if (amount != "" && !$.isNumeric(amount)) {
			$("#offlineweiamount").html(getDangerText("Invalid amount"));
		} else {
			$("#offlineweiamount").html('');
		}
	});
    
	$('.validateAddress').on('paste, keyup', function() {
        $('.'+$(this).attr('identicon')).css("background-image",'');
		if (validateEtherAddress($(this).val())) {
			$('.'+$(this).attr('status')).html('<p class="text-success"><strong> Address is valid</strong></p>').fadeIn(50);
			$('.'+$(this).attr('identicon')).css("background-image", 'url(' + blockies.create({
				seed: $(this).val().trim(),
				size: 8,
				scale: 16
			}).toDataURL() + ')');
		} else if ($(this).val() == "") {
			$('.'+$(this).attr('status')).html('');
		} else {
			$('.'+$(this).attr('status')).html('<p class="text-danger"><strong> Invalid address</strong></p>').fadeIn(50);
		}
	});
	$('#privkeypassword').on('paste, keyup', function() {
		if ($('#privkeypassword').val().length > 6) {
			$("#uploadbtntxt-wallet").hide();
			$("#uploadbtntxt-privkey").show();
			$("#walletuploadbutton").show();
		} else {
			$("#walletuploadbutton").hide();
		}
	});
	$('#manualprivkey').on('paste, keyup', function() {
		$("#divprikeypassword").hide();
		$("#walletuploadbutton").hide();
		$("#uploadbtntxt-wallet").hide();
		$("#uploadbtntxt-privkey").hide();
		$("#manualprivkey").val($("#manualprivkey").val().replace(/(?:\r\n|\r|\n| )/g, ''));
		if ($('#manualprivkey').val().length == 128 || $('#manualprivkey').val().length == 132) {
			$("#divprikeypassword").show();
		} else if ($('#manualprivkey').val().length == 64) {
			$("#uploadbtntxt-wallet").hide();
			$("#uploadbtntxt-privkey").show();
			$("#walletuploadbutton").show();
		}
	});
	$('.btn-file :file').change(function() {
		if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
			alert('The File APIs are not fully supported in this browser. Please use a modern browser');
			return;
		}
		var input = $(this),
			numFiles = input.get(0).files ? input.get(0).files.length : 1,
			label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
		input.trigger('fileselect', [numFiles, label]);
	});
	$('.btn-file :file').on('fileselect', function(event, numFiles, label) {
		$('#fuploadStatus').empty();
		$('#walletfilepassword').val('');
		PrivKey = "";
		file = $('.btn-file :file')[0].files[0];
		var fr = new FileReader();
		fr.onload = function() {
			try {
				if (walletRequirePass(fr.result)) {
					$("#walletPasdiv").show();
					$("#walletuploadbutton").hide();
				} else {
					$("#walletPasdiv").hide();
					$("#walletuploadbutton").show();
					$("#uploadbtntxt-wallet").show();
					$("#uploadbtntxt-privkey").hide();
				}
			} catch (err) {
				$('#fuploadStatus').append('<p class="text-center text-danger"><strong> ' + err + '</strong></p>');
			}
		};
		fr.readAsText(file);
		var input = $(this).parents('.input-group').find(':text'),
			log = numFiles > 1 ? numFiles + ' files selected' : label;
		if (input.length) {
			input.val(log);
		} else {
			if (log) {
				$('#fuploadStatus').append('<p class="text-center text-success"><strong> File Selected: ' + log + '</strong></p>');
			}
		}
	});
}

function resetDecryptValues() {
	PrivKey = "";
	$('#fuploadStatus').empty();
	$('#walletfilepassword').val('');
	$('#privkeypassword').val('');
	$('.btn-file :file').val('');
	$('#manualprivkey').val('');
	$("#walletuploadbutton").hide();
	$("#walletPasdiv").hide();
	$("#divprikeypassword").hide();
	$("#wallettransactions").hide();
	$("#decryptStatus").hide();
	$("#selectedTypeKey").hide();
	$("#privkeyViewW").val('');
	$("#qrcodeViewW").empty();
}

function preSendTransaction() {
	sendTransaction($("#tasignedtx").val(), function(data) {
		$("#txsendstatus").html('<p class="text-center text-success"><strong> Transaction submitted. TX ID: ' + data + '</strong></p>');
		setWalletBalance();
	}, function(err) {
		$("#txsendstatus").html('<p class="text-center text-danger"><strong>' + err + '</strong></p>');
	});
	$('#sendTransaction').modal('hide');
}

function preCreateTransaction() {
	try {
		$("#tarawtx").val("");
		$("#tasignedtx").val("");
		$("#txsendstatus").html('')
		var toAddress = $('#sendtxaddress').val();
		if (PrivKey.length != 64) throw "Invalid Private key, try again";
		if (!validateEtherAddress(toAddress)) throw "Invalid to Address, try again";
		if (!$.isNumeric($('#sendtxamount').val()) || $('#sendtxamount').val() <= 0) throw "Invalid amount, try again";
		var etherUnit = $('input[type=radio][name=currencyRadio]:checked').val();
		var weiAmount = toWei($('#sendtxamount').val(), etherUnit);
		createTransaction(PrivKey, toAddress, weiAmount, function(data) {
			$("#tarawtx").val(data.raw);
			$("#tasignedtx").val(data.signed);
			$("#txcreatestatus").html('<p class="text-center text-success"><strong> Transaction generated</strong></p>').fadeIn(50);
			$("#divtransactionTAs").show();
			$("#divsendtranaction").show();
			$("#confirmAmount").html($('#sendtxamount').val());
			$("#confirmCurrancy").html(etherUnit);
			$("#confirmAddress").html(toAddress);
		}, function(err) {
			$("#txcreatestatus").html('<p class="text-center text-danger"><strong> ' + err + '</strong></p>').fadeIn(50).fadeOut(3000);
			$("#divtransactionTAs").hide();
			$("#divsendtranaction").hide();
		});
	} catch (err) {
		$("#txcreatestatus").html('<p class="text-center text-danger"><strong> ' + err + '</strong></p>').fadeIn(50).fadeOut(3000);
		$("#divtransactionTAs").hide();
		$("#divsendtranaction").hide();
	}
}

function setWalletBalance() {
	getBalance($("#accountAddress").html(), function(result) {
		if (!result.error) {
			var bestCurAmount = getBestEtherKnownUnit(result.data.balance);
			$("[id=accountBalance]").html(bestCurAmount.amount + " " + bestCurAmount.unit);
			getETHvalue('USD', function(value) {
				usdval = value;
				tusdval = toFiat(bestCurAmount.amount, bestCurAmount.unit, value);
				$("[id=accountBalanceUsd]").html(formatCurrency(parseFloat(tusdval), '$') + " USD");
			});
			getETHvalue('EUR', function(value) {
				eurval = value;
				teurval = toFiat(bestCurAmount.amount, bestCurAmount.unit, value);
				$("[id=accountBalanceEur]").html(formatCurrency(parseFloat(teurval), '&euro;') + " EUR");
			});
			getETHvalue('BTC', function(value) {
				btcval = value;
				tbtcval = toFiat(bestCurAmount.amount, bestCurAmount.unit, value);
				$("[id=accountBalanceBtc]").html(tbtcval + " BTC");
			});
		} else
		console.log(result.msg);
	});
}

function walletSendDecryptSuccess() {
	var decrytedAdd = formatAddress(strPrivateKeyToAddress(PrivKey), 'hex');
	$("#accountAddress").html(decrytedAdd);
	$('.walletaddressIdenticon').css("background-image", 'url(' + blockies.create({
		seed: decrytedAdd,
		size: 8,
		scale: 16
	}).toDataURL() + ')');
	setWalletBalance();
	$("#decryptStatus").html('<p class="text-center text-success"><strong> Wallet successfully decrypted</strong></p>').fadeIn(2000);
	$("#wallettransactions").show();
}

function walletViewDecryptSuccess() {
	$("#decryptStatus").html('<p class="text-center text-success"><strong> Wallet successfully decrypted</strong></p>').fadeIn(2000);
	var privPass = $('#privkeypassword').val();
	//privPass == "" ? $("#encPrivKeyViewW").hide() : $("#encPrivKeyViewW").show();
	$("#decryptedWalletDetails").show();
	var decrytedAdd = formatAddress(strPrivateKeyToAddress(PrivKey), 'hex');
	$("#accountAddress").html(decrytedAdd);
	setWalletBalance();
	$('.addressIdenticonViewW').css("background-image", 'url(' + blockies.create({
		seed: decrytedAdd,
		size: 8,
		scale: 16
	}).toDataURL() + ')');
	$("#addressViewW").val(decrytedAdd);
	$("#privkeyViewW").val(PrivKey);
	$("#qrcodeAddViewW").empty();
	new QRCode($("#qrcodeAddViewW")[0], {
		text: decrytedAdd,
		width: $("#qrcodeAddViewW").width(),
		height: $("#qrcodeAddViewW").width(),
		colorDark: "#000000",
		colorLight: "#ffffff",
		correctLevel: QRCode.CorrectLevel.H
	});
	$("#qrcodeViewW").empty();
	new QRCode($("#qrcodeViewW")[0], {
		text: PrivKey,
		width: $("#qrcodeViewW").width(),
		height: $("#qrcodeViewW").width(),
		colorDark: "#000000",
		colorLight: "#ffffff",
		correctLevel: QRCode.CorrectLevel.H
	});
	var printjson = [];
	printjson.push({
		address: decrytedAdd,
		private: PrivKey
	});
	$("#printqrViewWallet").unbind();
	$("#printqrViewWallet").click(function() {
		openPrintPaperWallets(JSON.stringify(printjson));
	});
}
function offlineTxSuccess(){
    $("#decryptStatus").html(getSuccessText('Wallet successfully decrypted')).fadeIn(2000);
}
function walletDecryptFailed(err) {
	$("#decryptStatus").html('<p class="text-center text-danger"><strong> ' + err + '</strong></p>').fadeIn(50).fadeOut(3000);
	$("#wallettransactions").hide();
}

function formatCurrency(n, currency) {
	return currency + " " + n.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, "$1,");
}

function decryptFormData() {
	PrivKey = "";
	if (decryptType == 'fupload') {
		file = $('.btn-file :file')[0].files[0];
		var fr = new FileReader();
		fr.onload = function() {
			try {
				PrivKey = getWalletFilePrivKey(fr.result, $('#walletfilepassword').val());
				window[$('#decryptdata').attr('onDecrypt')]();
			} catch (err) {
				walletDecryptFailed(err);
			}
		};
		fr.readAsText(file);
	} else if (decryptType == 'privkey') {
		try {
			PrivKey = decryptTxtPrivKey($('#manualprivkey').val(), $("#privkeypassword").val());
			window[$('#decryptdata').attr('onDecrypt')]();
		} catch (err) {
			walletDecryptFailed("Invalid password"); 
		}
	}
}
function sendOfflineTxApprove(){
    sendTransaction($("#offlineSerializedTxPub").val(), function(data) {
		$("#offlineTxPublishStatus").html(getSuccessText('Transaction submitted. TX ID: ' + data));
	}, function(err) {
		$("#offlineTxPublishStatus").html(getDangerText(err));
	});
	$('#sendTransactionOffline').modal('hide');
}
function sendOfflineTx(){
    var serializedTx = $("#offlineSerializedTxPub").val();
    if(serializedTx==""){
        $("#offlineTxPublishStatus").html(getDangerText("empty transaction, try again")).fadeIn(50).fadeOut(5000);
        return;
    }
    try {
        var rawTx = rawToTransaction(serializedTx);
         var ethVal = toEther(rawTx.value,'wei');
         var toAdd = rawTx.to;
         $("#offlineConfirmAmount").html(ethVal);
         $("#offlineConfirmAddress").html(toAdd);
         $('#sendTransactionOffline').modal('show');      
    }catch(e){
        $("#offlineTxPublishStatus").html(getDangerText(e)).fadeIn(50).fadeOut(5000);
    }
}
function genSignedOfflineTx(){
    if (!$.isNumeric($('#offlineSendtxamount').val()) || $('#offlineSendtxamount').val() <= 0) { 
	   $("#offlineTxStatus").html(getDangerText("invalid value, try again")).fadeIn(50).fadeOut(5000);
		return;
	}
    var etherUnit = $('input[type=radio][name=currencyRadioOffline]:checked').val();
    var rawTx = {
		nonce: $('#offlineGasNonce').val(),
		gasPrice: $('#offlineGasPrice').val(),
		gasLimit: $('#offlineGasLimit').val(),
		to: $('#offlineToAdd').val(),
		value: toWei($('#offlineSendtxamount').val(), etherUnit),
		data: $('#offlineData').val()
	};
    createTransactionFromRaw(rawTx,PrivKey,function(data){
        $(".offlineSerializedTx").val(data.signed);
    }, function(error){
        $("#offlineTxStatus").html(getDangerText(error)).fadeIn(50).fadeOut(5000);
    });
}
function getAddressInfo(){
    var addField = $("#offlineFromAdd");
    var address = addField.val();
    if(!validateEtherAddress(address)){
        $('.'+addField.attr('status')).html(getDangerText('Invalid Address')).fadeIn(50);
    } else if(address=='') {
        $('.'+addField.attr('status')).html(getDangerText('Enter Address')).fadeIn(50);
    } else {
        getTransactionData(address, function(data) {
		  if (data.error) {
            $('.'+addField.attr('status')).html(getDangerText("Error occurred: " + data.msg)).fadeIn(50);
			return;
		  }
          data = data.data;
          data.gasprice = new BigNumber(data.gasprice).toString();
          data.nonce = new BigNumber(data.nonce).toString();
          $(".offlineGPrice").val(data.gasprice);
          $(".offlineNonce").val(data.nonce);
          $("#step1Output").show();
        });
    }
}
function hideAllMainContainers() {
	$("#paneWalgen").hide();
	$("#paneBulkgen").hide();
	$("#paneViewWalletDetails").hide();
	$("#paneSendTrans").hide();
	$("#paneOfflineTrans").hide();
	$("#paneHelp").hide();
	$("#paneContact").hide();
	$("#panePrint").hide();
	$("#privkeyViewW").val('');
	$("#decryptedWalletDetails").hide();
	$("#qrcodeViewW").empty();
	$("#bulk-generate").parent().removeClass('active');
	$("#generate-wallet").parent().removeClass('active');
	$("#view-wallet-info").parent().removeClass('active');
	$("#send-transaction").parent().removeClass('active');
	$("#offline-transaction").parent().removeClass('active');
	$("#offline-transaction").parent().removeClass('active');
	$("#help").parent().removeClass('active');
	$("#contact").parent().removeClass('active');
}

function generateSingleWallet() {
	var password = $("#ethgenpassword").val();
	if (password == "") {
		alert("Please enter a password.");
		return;
	}
	if (password.length < 7) {
		alert("Your password must be at least 7 characters");
		return;
	}
	$("#generatedWallet").show();
	var acc = new Accounts();
	var newAccountEnc = acc.new(password);
	$("#address").val(newAccountEnc.address);
	$('#addressIdenticon').css("background-image", 'url(' + blockies.create({
		seed: newAccountEnc.address,
		size: 8,
		scale: 16
	}).toDataURL() + ')');
	var addressHash = cryptoJSToHex(CryptoJS.SHA3(newAccountEnc.address));
	addressHash = addressHash.substr(addressHash.length - 4);
	var newAccountUnEnc = acc.get(newAccountEnc.address, password);
	$("#privkey").val(newAccountUnEnc.private);
	newAccountEnc.private = newAccountEnc.private + addressHash;
	$("#privkeyenc").val(newAccountEnc.private);
	$("#qrcodeAdd").empty();
	new QRCode($("#qrcodeAdd")[0], {
		text: newAccountEnc.address,
		width: $("#qrcode").width(),
		height: $("#qrcode").width(),
		colorDark: "#000000",
		colorLight: "#ffffff",
		correctLevel: QRCode.CorrectLevel.H
	});
	$("#qrcode").empty();
	new QRCode($("#qrcode")[0], {
		text: newAccountUnEnc.private,
		width: $("#qrcode").width(),
		height: $("#qrcode").width(),
		colorDark: "#000000",
		colorLight: "#ffffff",
		correctLevel: QRCode.CorrectLevel.H
	});
	var fileType = "text/json;charset=UTF-8";
	var encblob = new Blob([JSON.stringify(newAccountEnc)], {
		type: fileType
	});
	var unencblob = new Blob([JSON.stringify(newAccountUnEnc)], {
		type: fileType
	});
	$("#encdownload").attr('href', window.URL.createObjectURL(encblob));
	$("#encdownload").attr('download', newAccountEnc.address + '-Encrypted.json');
	$("#unencdownload").attr('href', window.URL.createObjectURL(unencblob));
	$("#unencdownload").attr('download', newAccountEnc.address + '-Unencrypted.json');
	acc.clear();
}

function generateBulkWallets() {
	var password = $("#bulkgenpassword").val();
	var count = $("#numberwallets").val();
	if (count == "") {
		alert("Please enter the amount of wallets you want to generate.");
		return;
	} else if (count != parseInt(count, 10)) {
		alert("Digits only please");
		return;
	}
	var isencrypted = false;
	if (password != "" && password.length < 7) {
		alert("Your password must be at least 7 characters.");
		return;
	} else if (password != "" && password.length >= 7) {
		isencrypted = true;
	}
	if (isencrypted) $("#bulkIsEnc").html(" (Encrypted)")
	else
	$("#bulkIsEnc").html(" (Unencrypted)")
	$("#generatedbulkwallets").show();
	$('#bulkgentable tr:not(:first)').remove();
	var acc = new Accounts();
	var csv = "";
	var jsonarr = [];
	var printjson = [];
	var txt = "";
	for (var i = 0; i < count; i++) {
		if (isencrypted) {
			var newAccount = acc.new(password);
			var addressHash = cryptoJSToHex(CryptoJS.SHA3(newAccount.address));
			addressHash = addressHash.substr(addressHash.length - 4);
			newAccount.private = newAccount.private + addressHash;
		} else
		var newAccount = acc.new();
		$('#bulkgentable tr:last').after('<tr class="privaddkey"><td><div id="addressIdenticon" class="addressIdenticon-' + i + '"></div></td><td><textarea class="form-control" rows="4" type="text" disabled>' + newAccount.address + '</textarea></td><td><textarea class="form-control" rows="4" type="text" disabled>' + newAccount.private + '</textarea></td></tr>');
		$(".addressIdenticon-" + i).css("background-image", 'url(' + blockies.create({
			seed: newAccount.address,
			size: 8,
			scale: 16
		}).toDataURL() + ')');
		csv += newAccount.address + ',' + newAccount.private + '\n';
		txt += newAccount.address + '\t' + newAccount.private + '\n';
		jsonarr.push({
			address: newAccount.address,
			private: newAccount.private
		});
		printjson.push({
			address: newAccount.address,
			private: acc.get(newAccount.address, password).private
		});
	}
	var csvblob = new Blob([csv], {
		type: "text/csv;charset=UTF-8"
	});
	var txtblob = new Blob([txt], {
		type: "text/plain;charset=UTF-8"
	});
	var jsonblob = new Blob([JSON.stringify(jsonarr)], {
		type: "text/json;charset=UTF-8"
	});
	var fname = "bulk_ether_accounts";
	$("#bulkexportjson").attr('href', window.URL.createObjectURL(jsonblob));
	$("#bulkexportjson").attr('download', fname + '.json');
	$("#bulkexportcsv").attr('href', window.URL.createObjectURL(csvblob));
	$("#bulkexportcsv").attr('download', fname + '.csv');
	$("#bulkexporttxt").attr('href', window.URL.createObjectURL(txtblob));
	$("#bulkexporttxt").attr('download', fname + '.txt');
	$("#bulkwalletprint").unbind();
	$("#bulkwalletprint").click(function() {
		openPrintPaperWallets(JSON.stringify(printjson));
	});
	acc.clear();
}

function openPrintPaperWallets(strjson) {
	var win = window.open("about:blank", "_blank");
	data = "<html><head><link rel=\"stylesheet\" href=\"css\/etherwallet-master.min.css\"\/><script type=\"text\/javascript\" src=\"js\/jquery-1.11.3.min.js\"><\/script><script type=\"text\/javascript\" src=\"js\/etherwallet-static.min.js\"><\/script><script type=\"text\/javascript\">function generateWallets(){    var json = JSON.parse($(\"#printwalletjson\").html());    for(var i=0;i<json.length;i++){        var walletTemplate = $(\'<div\/>\').append($(\"#print-container\").clone());        new QRCode($(walletTemplate).find(\"#paperwalletaddqr\")[0], {\t\t  text: json[i][\'address\'],\t\t  colorDark: \"#000000\",\t\t  colorLight: \"#ffffff\",\t\tcorrectLevel: QRCode.CorrectLevel.H\t   });       new QRCode($(walletTemplate).find(\"#paperwalletprivqr\")[0], {\t\t  text: json[i][\'private\'],\t\t  colorDark: \"#000000\",\t\t  colorLight: \"#ffffff\",\t\tcorrectLevel: QRCode.CorrectLevel.H\t   });       $(walletTemplate).find(\"#paperwalletadd\").html(json[i][\'address\']);       $(walletTemplate).find(\"#paperwalletpriv\").html(json[i][\'private\']);       walletTemplate = $(walletTemplate).find(\"#print-container\").show();       $(\"body\").append(walletTemplate);    }    setTimeout(function(){window.print();},2000);}<\/script><\/head><body><span id=\"printwalletjson\" style=\"display: none;\">{{WALLETJSON}}<\/span><div class=\"print-container\" style=\"display: none; margin-bottom: 28px;\" id=\"print-container\">        <img src=\"images\/logo-1.png\" class=\"ether-logo-1\" height=\"100%\" width=\"auto\"\/>        <img src=\"images\/logo-2.png\" class=\"ether-logo-2\"\/>        <img src=\"images\/ether-title.png\" height=\"100%\" width=\"auto\" class=\"print-title\"\/>          <div class=\"print-qr-code-1\">          <div id=\"paperwalletaddqr\"><\/div>            <p class=\"print-text\" style=\"padding-top: 25px;\">YOUR ADDRESS<\/p>          <\/div>          <div class=\"print-qr-code-2\">            <div id=\"paperwalletprivqr\"><\/div>            <p class=\"print-text\" style=\"padding-top: 30px;\">YOUR PRIVATE KEY<\/p>          <\/div>          <div class=\"print-notes\">            <img src=\"images\/notes-bg.png\" width=\"90%;\" height=\"auto\" class=\"pull-left\" \/>            <p class=\"print-text\">AMOUNT \/ NOTES<\/p>          <\/div>        <div class=\"print-address-container\">          <p>            <strong>Your Address:<\/strong><br \/>            <span id=\"paperwalletadd\"><\/span>          <\/p>          <p>            <strong>Your Private Key:<\/strong><br \/>            <span id=\"paperwalletpriv\"><\/span>        <\/p>    <\/div><\/div><\/body><\/html>";
	data = data.replace("{{WALLETJSON}}", strjson);
	win.document.write(data);
	$(win).ready(function() {
		win.document.write("<script>generateWallets();</script>");
	});
}

function printQRcode() {
	var address = $("#address").val();
	var privkey = $("#privkey").val();
	var jsonarr = [];
	jsonarr.push({
		address: address,
		private: privkey
	});
	openPrintPaperWallets(JSON.stringify(jsonarr));
}