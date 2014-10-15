//player data
var players;
//instantiate socket
var socket = io.connect('http://localhost:1337');
//get playerID from passed url
var playerID = location.search.split('playerID=')[1];
//load google viz package
google.load("visualization", "1", {packages: ["orgchart"]});
google.setOnLoadCallback(drawChart);


var chart;
var data;

$(function() {
    $('#gamestart').click(startGame);

    //fetch player data when syn-acked with app.js
    socket.on("info", function(data){
        if(data.hasOwnProperty('info')    &&
           data.info == "ready to orga"   && 
           data.hasOwnProperty('players')) {
            
            if(typeof(players) == 'undefined'){
                players = data.players;
                
                if(playerID != "1"){
                    var playerOneName;
                    $.each(window.players, function(key, value) {
                        if(value.id == '1'){
                            console.log("player oen name is "+value.name);
                            playerOneName = value.name;
                        }
                    });
                    $('p.text-info').text("Please refer to the screen of "+playerOneName+" and organize your group.");
                    $('p.text-info').show(400);
                }else{
                    $('p.text-info').text("Please organize your group.");
                    $('p.text-info').show(400);
                }

                //draw the chart / make use of received player list
                drawPlayers(players);
                drawChart(players);
            }
        }else if(data.hasOwnProperty('info')    &&
           data.info == "ready to play") {
            window.location = '/game?playerID='+playerID;
        }
    });

    
});

// Hide everything
$('p.text-info').hide();
if(playerID != "1"){
    $('#players').hide();
    $('#chart').hide();
    $('#gamestart').hide();
}

//initiate server communication and fetch player data
socket.emit("orgaInit");

//create the player list / make use of received player list
function drawPlayers(players){
    $.each(players, function(key, value) {
        if(value.id == 1){
            $('ul').append('<li><button class="selected" width=100px>' + value.name + '</button></li>');
        }else{
            $('ul').append('<li><button>' + value.name + '</button></li>');

        }
    });
    $('#players ul li button').click(onPlayerSelected);
}

function drawChart(players) {
    data = new google.visualization.DataTable();
    data.addColumn('string', 'Name');
    data.addColumn('string', 'Manager');
    data.addColumn('string', 'ToolTip');

    if(players.length%2==0){

        //even number of players
        //display roles as tooltip
        //add first player on each side
        data.addRow(['Operator 1','','Operator']);
        data.addRow(['Disponent 1','','Disponent']);
        //add all other players on both sides
        for(var i = 1; i < players.length/2; i++){
            data.addRow(['Operator '+(i+1),'Operator 1','Operator']);
            data.addRow(['Disponent '+(i+1),'Disponent 1','Disponent']);
        }
    }else{
        //odd number of players
        //display role as tooltip
        //add first player on each side
        data.addRow(['Operator 1','','Operator']);
        data.addRow(['Disponent 1','','Disponent']);
        //add all other players on both sides
        for(var i = 1; i < (players.length-1)/2; i++){
            data.addRow(['Operator '+(i+1),'Operator 1','Operator']);
            data.addRow(['Disponent '+(i+1),'Disponent 1','Disponent']);
        }
        //add one additional player on operators side
        data.addRow(['Operator '+((players.length+1)/2),'Operator 1','Operator']);
    }

//     data.addRows([
// //        [
// //            {v: 'Mike', f: 'Mike<div style="color:red; font-style:italic">President</div>'},
// //            '',
// //            'The President'
// //        ],
//         ['Position 1','',''],
//         ['Position 2','Position 1',''],
//         ['Position 3', 'Position 2', ''],
//         ['Position 4', 'Position 1', ''],
//         ['Position 5', 'Position 3', '']
//         // ['Position 6','',''],
//         // ['Position 7','Position 6',''],
//         // ['Position 8', 'Position 7', ''],
//         // ['Position 9', 'Position 6', ''],
//         // ['Position 10', 'Position 8', '']
//     ]);

    chart = new google.visualization.OrgChart(document.getElementById('chart'));

    google.visualization.events.addListener(chart, 'select', onPositionSelected);

    chart.draw(data, {allowHtml: true});
    console.log("chart drawed");
}

function onPositionSelected(e) {
    var selection = chart.getSelection();

    if (selection.length > 0 && $('.selected').length === 1) {
        data.setFormattedValue(selection[0].row, 0, $('.selected').text());
        chart.draw(data, {allowHtml: true});
    }
}

function onPlayerSelected() {
    console.log("onPLayerSelected");
    $('.selected').removeClass("selected");

    $(this).addClass("selected");
}

function startGame(){
    socket.emit("orgaDone");
}