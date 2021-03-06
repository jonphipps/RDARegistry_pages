function gup(name, url, theDefault) {
    if (!url) url = location.href;
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(url);
    return results == null ? theDefault : results[1];
}
var docLang = gup('language', Location.href, 'en');
$("#lang_" + docLang).css("border", "3px solid red");

//noinspection ThisExpressionReferencesGlobalObjectJS
(function () {
    $(function () {
        $('pre').addClass('prettyprint');
        return prettyPrint();
    });

}).call(this);

/* Formatting function for row details - modify as you need */
function format(d) {
    // `d` is the original data object for the row

    //TODO: build output and formatting instructions from the context
    var blacklist = ['toolkitDefinition', 'toolkitLabel', 'prefLabel', 'definition', 'inScheme', '@type'];
    if (typeof d != "undefined") {
        var ownKeys = Object.getOwnPropertyNames(d).sort();
        var property = '';

        var rows = '<table class="pindex_detail">';
        for (i = 0, len = ownKeys.length; i < len; i++) {
            property = ownKeys[i];
            if (typeof property != "undefined" && blacklist.indexOf(property) == -1) {
                rows += '<tr>' + '<td id="detail_key_' + property + '">' + property + ':</td>' + '<td class="definition" id="detail_def_' + property + '">';
                switch(property) {
                    case '@id':
                    case 'api':
                    case 'inScheme':
                        rows +=  makeLink(d[property]);
                        break;
                    case 'altLabel':
                    case 'prefLabel':
                    case 'toolkitLabel':
                        rows += makeLiteral(d[property]) + ' ' + getLanguageCallout(d[property]);
                        break;
                    case 'definition':
                    case 'toolkitDefinition':
                        rows += makeLiteral(d[property]) + ' ' + getLanguageCallout(d[property]);
                        break;
                    default:
                        rows += '"' + d[property] + '"';
                }
            }
            rows += "</td></tr>\n";
        }
        return rows + "</table>";
    }
}

function formatRef(data, classname) {
    if (typeof data != "undefined") {
        if (typeof data.lexicalAlias != "undefined") {
            return '<div class="' + classname + '">' +
                formatCanon(data) + formatLabel(data) +
                '</div>';
        }
        else {
            return '<div class="' + classname + '">' + data + '</div>';
        }
    }
}

function formatCanon(data) {
    if (typeof data["@id"] != "undefined") {
        var url = data["@id"];
        return '<div class="vcanon">' +
            '<a href="' + url + '" title="Canonical URI: ' + url + '">' + makeCurie(url) + '</a>' +
            '</div>';
    }
}

function formatLabel(data) {
    var url = data["@id"];
    return '<div class="vurllabel">' +
        '<a href="' + url + '">' + makeLiteral(data.prefLabel) + '</a> ' + getLanguageCallout(data.prefLabel) +
        '</div>';

}


function formatRefArray(data, classname) {
    var value = "";
    if (typeof data != "undefined") {
        if (data instanceof Array) {
            for (i = 0; i < data.length; ++i) {
                value += formatRef(data[i], classname)
            }
        }
        else {
            value = formatRef(data, classname)
        }
    } else {
        value = "undefined"
    }
    return value;
}

function makeCurie(uri) {
    if (typeof uri.replace === "function") {
        return uri.replace(/^(http:\/\/rdaregistry\.info\/termList\/)(.*)\/(.*)$/ig, prefix + ":$3");
    }
}

function makeUrl(uri) {
    if (typeof uri.replace === "function") {
        return uri.replace(/^(http:\/\/)(.*)\/(.*)$/ig, "$1www.$2/#$3");
    }
}
function makeUri(uri) {
    if (typeof uri.replace === "function") {
        return uri.replace(/^(http:\/\/)(.*)\/(.*)$/ig, "$1$2/$3");
    }
}

function makeLink(uri) {
    if (typeof uri.replace === "function") {
        return '<a href="' + uri + '">' + uri + '</a>';
    }
}

function makeLiteral(data) {
    if (typeof data != "undefined") {
        if (typeof data[docLang] != "undefined") {
            return '"' + data[docLang] + '"';
        }
        if (typeof data['en'] != "undefined") {
            return '"' + data['en'] + '"';
        }
    }
    return '"' + data + '"';
}

function getLanguageCallout(data){
if (typeof data[docLang] != "undefined") {
            return  "@" + docLang;
        }
        if (typeof data['en'] != "undefined") {
            return "@en";
        }

    return "@en *";
}
function setFilter() {

    var initFilter = null;
    if (window.location.hash.indexOf('#') > -1) {
        initFilter = window.location.hash.substr(1);
    }
    return initFilter;
}

function setSearch(filter) {
    var table = $("table#pindex").DataTable();
    table
        .search('')
        .column(2).search(filter)
        .draw();
    $('input[type=search]').val(filter);

}

function filterConcepts(obj) {
    return obj["@type"] == "Concept";
}

var initFilter = setFilter();

//make sure we initiate a search when the hash changes
window.onhashchange = function () {
    var initFilter = setFilter();
    setSearch(initFilter);
};

$(document).ready(
    function () {
        var t8lines = 2;
        var dtable = $("#pindex");
        var table = dtable.DataTable({
            "ajax": {
                url: dataSource,
                dataType: 'json',
                cache: true,
                crossDomain: true,
                "dataSrc": function (json) {
                    json.data = json["@graph"].filter(filterConcepts);
                    return json.data;
                }
            },
            "columns": [
                {
                    "orderable": false,
                    "class": 'permalink',
                    "render": function (data, type, row) {
                        if (typeof row["@id"] != "undefined") {
                            var url = makeUrl(row["@id"]);
                            var id = row["@id"].replace(/^.*\/(.*)$/ig, "$1");
                            return '<a id="' + id + '" href="' + url + '" title="permalink: ' + url + '">#</a>';
                        }
                    }
                },
                {
                    "class": 'details-control',
                    "orderable": false,
                    "data": null,
                    "defaultContent": ''
                },
                {
                    "render": function (data, type, row) {
                        return formatCanon(row);
                    }
                }, {
                    "render": function (data, type, row) {
                        return formatLabel(row);
                    }
                },
                {
                    "class": "definition",
                    "render": function (data, type, row) {
                        var definition = makeLiteral(row.definition) + ' ' + getLanguageCallout(row.definition);
                        return formatRefArray( definition, "definition");
                    }
                }
            ],
            "order": [
                [2, 'asc']
            ],
            "lengthMenu": [
                [25, 50, 100, -1],
                [25, 50, 100, "All"]
            ],
            "deferRender": true
        });

// Add event listener for truncate on draw
        dtable.on('draw.dt', function () {
            if (initFilter) {
                var tr = $("#" + initFilter).closest('tr');
                var row = table.row(tr);
                if (typeof row.child(format(row.data())) != "undefined") {
                    row.child(format(row.data())).show();
                    tr.addClass('shown');
                }
                $("div#pindex_filter input").val(initFilter);
            }
        });

// Add event listener for opening and closing details
        dtable.children("tbody").on('click', 'td.details-control', function () {
            var tr = $(this).closest('tr');
            var t8 = tr.children("td.too-long");
            var row = table.row(tr);

            if (row.child.isShown()) {
                // This row is already open - close it
                row.child.hide();
                tr.removeClass('shown');
                t8.trunk8({lines: 2});
            }
            else {
                // Open this row
                row.child(format(row.data())).show();
                tr.addClass('shown');
                t8.trunk8('revert');
            }
        });


        $('input[type=search]').on('click', function () {
            if (history.pushState) {
                history.pushState(null, null, document.location.pathname);
            }
            else {
                location.hash = '';
            }
            setSearch('');
        });

        if (initFilter) {
            table.column(2).search(initFilter);
            $("div#pindex_filter input").val(initFilter);
        }

    }
);

$.fn.dataTableExt.oApi.clearSearch = function (oSettings) {
    var table = $("#pindex").DataTable();
    var clearSearch = $('<img class = "delete" title="Cancel Search" alt="" src="data:image/png;data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAD2SURBVHjaxFM7DoMwDH2pOESHHgDPcB223gKpAxK34EAMMIe1FCQOgFQxuflARVBSVepQS5Ht2PHn2RHMjF/ohB8p2gSZpprtyxEHX8dGTeMG0A5UlsD5rCSGvF55F4SpqpSm1GmCzPO3LXJy1LXllwvodoMsCpNVy2hbYBjCLRiaZ8u7Dng+QXlu9b4H7ncvBmKbwoYBWR4kaXv3YmAMyoEpjv2PdWUHcP1j1ECqFpyj777YA6Yss9KyuEeDaW0cCsCUJMDjYUE8kr5TNuOzC+JiMI5uz2rmJvNWvidwcJXXx8IAuwb6uMqrY2iVgzbx99/4EmAAarFu0IJle5oAAAAASUVORK5CYII="  style="cursor:pointer;padding-left:.5em;" />');
    $(clearSearch).click(function () {
        setSearch('');
        table.search('');
        if (initFilter) {
            initFilter = null;
            var tr = $("#" + initFilter).closest('tr');
            var row = table.row(tr);
            if (typeof row.child(format(row.data())) != "undefined") {
                row.child(format(row.data())).hide();
                tr.removeClass('shown');
            }
            if (history.pushState) {
                history.pushState(null, '', document.location.pathname);
            }
            else {
                location.hash = '';
            }
        }
    });
    $(oSettings.nTableWrapper).find('div.dataTables_filter').append(clearSearch);
    $(oSettings.nTableWrapper).find('div.dataTables_filter label').css('margin-right', '-16px');//16px the image width
    $(oSettings.nTableWrapper).find('div.dataTables_filter input').css('padding-right', '16px');
};

//auto-execute, no code needs to be added
$.fn.dataTable.models.oSettings['aoInitComplete'].push({
    "fn": $.fn.dataTableExt.oApi.clearSearch,
    "sName": 'whatever'
});

$(document).ready(function () {
    $.protip({
        defaults: {
            position: 'top-left',
            gravity: true,
            delayIn: 500
        }
    })
});
