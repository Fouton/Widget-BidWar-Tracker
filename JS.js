let fieldData;
let earnings = [];
let bar = [0,0,0,0,0,0,0,0];
let fixedLoading = false;
let max = 0;

window.addEventListener('onWidgetLoad', function (obj) {
    fieldData = obj.detail.fieldData;
  	LoadBars();
  	LoadState();
	UpdateAll();
});

window.addEventListener('onEventReceived', function (obj) {
  	if (!fixedLoading) UpdateAll();
    if (!obj.detail.event) return;
    let event = obj.detail.listener;
    let data = obj.detail.event;
    if (data.bulkGifted)
      return;
  	if (event == 'subscriber-latest') {
      EarnPoints((data.tier ? TierValue(data.tier) : 1) * fieldData.pointsPerSub, data.sender ? data.sender : data.name);
    }
  	else if (event == 'cheer-latest') {
      EarnPoints(data.amount * fieldData.pointsPerBit / 100, data.name);
    }
  	else if (event == 'tip-latest') {
      EarnPoints(data.amount * fieldData.pointsPerTip, data.name);
    }
  	else if (event == 'message') {
      const {text, nick, tags, channel} = obj.detail.event.data;
      const userstate = {
        'mod': parseInt(tags.mod),
        'vip': (tags.badges.indexOf("vip") !== -1),
        'broadcaster': (nick === channel)
      };
      text1 = text.toLowerCase();
      if (text1.startsWith(fieldData.clearCommand.toLowerCase()) && (userstate.broadcaster || userstate.mod)) {
        ClearData();
        return;
      }
      if (text1.startsWith(fieldData.addCommand.toLowerCase()) && (userstate.broadcaster || (fieldData.managePermissions=="mods" && userstate.mod))) {
        let bidOptionText = text.replace(fieldData.addCommand.toLowerCase(),"").trim();
        let bidReturn = GetBid(bidOptionText);
        if (Number(bidReturn[1]) != NaN) { AddPoints(Number(bidReturn[1]),bidReturn[0]); }
        return;
      }
      if (text1.startsWith(fieldData.removeCommand.toLowerCase()) && (userstate.broadcaster || (fieldData.managePermissions=="mods" && userstate.mod))) {
  		let bidOptionText = text.replace(fieldData.removeCommand.toLowerCase(),"").trim();
        let bidReturn = GetBid(bidOptionText);
        if (Number(bidReturn[1]) != NaN) {RemovePoints(Number(bidReturn[1]),bidReturn[0]);}
        return;
      }
      if (text1.startsWith("!bidhelp")) {
        GiveError("Use "+fieldData.bidCommand+" followed by the Option's text. Then include an amount or all.");
        return;
      }
      if (text1.startsWith(fieldData.bidCommand.toLowerCase())) {
  		let bidOptionText = text.replace(fieldData.bidCommand.toLowerCase(),"").trim();
        let bidReturn = GetBid(bidOptionText);
        if (bidReturn[1] === "all" || Number(bidReturn[1]) != NaN) {
          SpendPoints(bidReturn[1] === "all" ? bidReturn[1] : Number(bidReturn[1]),nick,bidReturn[0]);
          return;
        }
        else {
          GiveError("Invalid Bid Quantity. Please use "+fieldData.bidCommand+" <Option> <Quantity>.");
          return;
        }
        GiveError("Bid did not include a valid bid option. Please use "+fieldData.bidCommand+" <Option> <Quantity>.");
      }
    }
});
  
function TierValue(tier) {
  if (tier == 3000) return 6;
  else if (tier == 2000) return 2;
  else return 1;
}

function LoadBars() {
  GetMax();
  for (let i = 1; i <= 8; i++) {
    if (i <= fieldData.numGoals) {
      $('#bidText'+i).html(fieldData["bid"+i+"Text"] + ": $");
      $("#bar"+i).css('width', Math.min(100, bar[i-1]*100/(max===0?1:max)) + "%");
      $("#percent"+i).html(parseFloat(bar[i-1]).toFixed(2));
    }
  	else {
      $('#bidText'+i).html(" ");
      $("#bar"+i).css('width', "0%");
      $("#percent"+i).html(" ");
    }
  }
}

function GiveError(text) {
  ;
}

function GetBid(bidOptionText) {
  for (let i = 1; i <= fieldData.numGoals; i++) {
    if (bidOptionText.startsWith(fieldData["bid"+i+"Text"].toLowerCase())) {
      let bidAmountText = bidOptionText.replace(fieldData["bid"+i+"Text"].toLowerCase(), "").trim();
      return [i, bidAmountText];
    }
  }
  return ("Error")
}

function EarnPoints(amount, name) {
  let pos = -1;
  for(var i = 0; i < earnings.length; i++) {
      if (earnings[i].name === name) {
          pos = i;
          break;
      }
  }
  if (pos != -1) {
    earnings[pos].amount += amount;
    SaveState();
    return;
  }
  let newEarner = {"name": name,"amount": amount};
  earnings.unshift(newEarner);
  SaveState();
}

function SpendPoints(amount, name, bid) {
  const pos = earnings.map(e => e.name).indexOf(name);
  if (pos != -1 && amount != "all" && earnings[pos].amount >= amount) {
    bar[bid-1] += amount;
    earnings[pos].amount -= amount;
    UpdateBar(bar[bid-1],bid);
    SaveState();
  }
  else if (amount == "all") {
    bar[bid-1] += earnings[pos].amount;
    earnings[pos].amount = 0;
    UpdateBar(bar[bid-1],bid);
    SaveState();
  }
  else {
    GiveError(""+name+", you only have " + earnings[pos].amount + " points.");
  }
}

function UpdateBar(amount, bar) {
  	GetMax();
  	if (bar <= fieldData.numGoals) {
      $('#bidText'+bar).html(fieldData["bid"+bar+"Text"] + ": $");
      $("#bar"+bar).css('width', Math.min(100, amount*100/(max===0?1:max)) + "%");
      $("#percent"+bar).html(parseFloat(amount).toFixed(2));
    }
  	else {
      $('#bidText'+bar).html(" ");
      $("#bar"+bar).css('width', "0%");
      $("#percent"+bar).html(" ");
    }
}

function UpdateAll() {
  	GetMax();
  	for (i = 1; i < 9; i++) {    
      if (i <= fieldData.numGoals) {
        $('#bidText'+i).html(fieldData["bid"+i+"Text"] + ": $");
        $("#bar"+i).css('width', Math.min(100, bar[i-1]*100/(max===0?1:max)) + "%");
        $("#percent"+i).html(parseFloat(bar[i-1]).toFixed(2));
      }
      else {
        $('#bidText'+i).html(" ");
        $("#bar"+i).css('width', "0%");
        $("#percent"+i).html(" ");
      }
    }
}

function AddPoints(amount, bid) {
    bar[bid-1] += amount;
    UpdateBar(bar[bid-1],bid);
    SaveState();
}

function RemovePoints(amount, bid) {
    bar[bid-1] -= amount;
    UpdateBar(bar[bid-1],bid);
    SaveState();
}

function ClearData() {
  earnings.length = 0;
  max=0;
  for (let i = 0; i <= 7; i++){
  	bar[i] = 0;
  }
  UpdateAll();
  SaveState();
}

function GetMax() {
  max = 0;
  for (let i = 0; i <= 7; i++) { 
    if (bar[i] > max) max = bar[i];
  }
}

function LoadState() {
  	SE_API.store.get('bidwar').then(obj => {
        if (obj !== null) {
            earnings = obj.earnings;
          	bar = obj.bar;
        }
        for (let i = 0; i <= 7; i++){
          UpdateBar(bar[i],i+1);
        }
    });
}

function SaveState() {
    SE_API.store.set('bidwar', {bar: bar, earnings: earnings});
}

function test(text, value, slot) {
    if (text) $('#bidText'+slot).html(text);
    if (value) $('#percent'+slot).html(value);
}