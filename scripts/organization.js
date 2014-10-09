$(function () {
    $('#players p').click(onPlayerSelected);
    $('#gamestart').click(startGame);
});


var chart;
var data;

google.load("visualization", "1", {packages: ["orgchart"]});
google.setOnLoadCallback(drawChart);

function drawChart() {
    data = new google.visualization.DataTable();
    data.addColumn('string', 'Name');
    data.addColumn('string', 'Manager');
    data.addColumn('string', 'ToolTip');

    data.addRows([
//        [
//            {v: 'Mike', f: 'Mike<div style="color:red; font-style:italic">President</div>'},
//            '',
//            'The President'
//        ],
        ['Position 1','','This player will be the main coordinator in the game!'],
        ['Position 2','Position 1',''],
        ['Position 3', 'Position 2', ''],
        ['Position 4', 'Position 1', ''],
        ['Position 5', 'Position 3', '']
    ]);

    chart = new google.visualization.OrgChart(document.getElementById('chart_div'));


    google.visualization.events.addListener(chart, 'select', onPositionSelected);

    chart.draw(data, {allowHtml: true});
}


function onPositionSelected(e) {
    var selection = chart.getSelection();

    if (selection.length > 0 && $('.selected').length === 1) {

        data.setFormattedValue(selection[0].row, 0, $('.selected').text());
        chart.draw(data, {allowHtml: true});
    }
}

function onPlayerSelected() {
    $('.selected').removeClass("selected");

    $(this).addClass("selected");
}