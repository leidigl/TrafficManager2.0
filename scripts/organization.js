$(function () {
    $('#players p').click(onPlayerSelected);
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
        [
            {v: 'Mike', f: 'Mike<div style="color:red; font-style:italic">President</div>'},
            '',
            'The President'
        ],
        [
            {v: 'Jim', f: 'Jim<div style="color:red; font-style:italic">Vice President<div>'},
            'Mike',
            'VP'
        ],
        ['Alice', 'Mike', ''],
        ['Bob', 'Jim', 'Bob Sponge'],
        ['Carol', 'Bob', '']
    ]);

    chart = new google.visualization.OrgChart(document.getElementById('chart_div'));

    //chart.addEventListener("select",test);

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