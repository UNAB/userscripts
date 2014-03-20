// ==UserScript==
// @name           workflow
// @namespace      https://github.com/UNAB/userscripts
// @description    Mejoras en interfaz de Workflow
// @include        http://172.16.11.141/*
// @downloadURL    https://raw.github.com/UNAB/userscripts/master/workflow.user.js
// @license        GPL-3.0+
// @author         Esteban De La Fuente Rubio, DeLaF (esteban[at]delaf.cl)
// @version        dev-master
// ==/UserScript==

var config = {
    'routes': {
        '/Default.aspx': 'default',
        '/Inscripcion.aspx': 'inscripcion',
        '/Inscripcion2.aspx': 'inscripcion'
        },
    'pages': {
        'inscripcion': {
            'tables' : {
                'ramos': {
                    'vacantes': {
                        '/Inscripcion.aspx': 13,
                                '/Inscripcion2.aspx': 9
                    }
                }
            },
            'messages': {
                'responsabilidad': 'Se acepta bajo exclusiva responsabilidad del alumno.',
                'novacantes': '\n\nRamos no inscritos es porque NRC especificados no disponían de vacantes.',
                'ningunavacante': 'Se rechaza solicitud puesto que NRC(s) solicitado(s) no tiene(n) vatante(s).'
            },
            'errors': {
                'nocompletada': 'the work item is not in a state that allows completion'
            }
        }
    }
};

function Workflow ()
{
}

Workflow.bootstrap = function ()
{
        Workflow.createHeader ();
    Workflow['bootstrap_'+config.routes[window.location.pathname]] ();
}

Workflow.createHeader = function ()
{
    $('body').append('<div id="Workflow_header"></div>');
    $('#Workflow_header').attr('style', 'width:100%; height:50px; top:0; left:0; position:fixed; border-bottom:2px solid #858585; background:#88898c; color:white; padding:10px');
    $('.linkcr').attr('style', 'margin-top:70px');
    $('#Workflow_header').append('Workflow: ');
}

Workflow.bootstrap_default = function ()
{
    var n_solicitudes = 0;
    $("#MainContent_GridView1").dataTable().fnDestroy();
    $("#MainContent_GridView1 tbody tr > td > a").each(function () {
        $(this).attr('href', $(this).attr('href').replace('__doPostBack', 'Workflow.solicitud_abrir')+'; return false');
        $(this).click (Workflow.solicitud_abrir);
        n_solicitudes++;
    });
    $('#Workflow_header').append('<br />Solicitudes = <span id="n_solicitudes">'+n_solicitudes+'</span>');
}

Workflow.solicitud_abrir = function (evt) {
    $('a[href='+evt.target.href+']').parent().parent().remove();
    var params = evt.target.href.replace("javascript:Workflow.solicitud_abrir('", '').replace("'); return false", '').split("','");
    //__EVENTTARGET, __EVENTARGUMENT
    $('#n_solicitudes').text($('#n_solicitudes').text()-1);
    window.openPost (
        $('#ctl01').attr('action'),
        {
            '__VIEWSTATE': $('#__VIEWSTATE').attr('value'),
            '__EVENTVALIDATION': $('#__EVENTVALIDATION').attr('value'),
            '__EVENTTARGET': params[0],
            '__EVENTARGUMENT': params[1]
        }
    );
}

Workflow.bootstrap_inscripcion = function ()
{
    // modificar la página
    $('#Workflow_header').append('<input type="button" id="aceptarRamos" value="Aceptar todos los ramos con vacantes" accesskey="a" /> ');
    $('#Workflow_header').append('<input type="button" id="completarSolicitud" value="Completar la solicitud" accesskey="c" /> ');
    $('#Workflow_header').append('<a href="'+$('a[target=blank]').attr('href')+'" target="_blank" style="color:orange;text-decoration:underline">FICHA DEL ALUMNO</a> ');
    $("html, body").animate({ scrollTop: $('#MainContent_LblSolicitud').parent().parent().parent().parent().parent().parent().offset().top }, 500);
    $("#aceptarRamos").click (Workflow.Inscripcion_aceptarRamos);
    $("#completarSolicitud").click (Workflow.Inscripcion_completarSolicitud);
    // detectar si hubo error al completar la solicitud y hacer click nuevamente para volver a completar
    if ($('#MainContent_V_ERROR').length &&  $('#MainContent_V_ERROR').text()==config.pages.inscripcion.errors.nocompletada) {
        console.log ('Hubo error al completar, reintentando...');
        $('#MainContent_Completar').click();
    }
}

Workflow.Inscripcion_aceptarRamos = function ()
{
    if ($('#MainContent_ButtonInsc').is(':disabled')==false) {
        var ramos = 0;
        var aceptados = 0;
        $('#MainContent_GridInsc tr:gt(0)').each(function () {
            ramos++;
            // marcar el curso solo si tiene vacantes
            if($('td:nth-child('+config.pages.inscripcion.tables.ramos.vacantes[window.location.pathname]+')', this).text()>0) {
                aceptados++;
                $('input[type=checkbox]:eq(0)', this).attr('checked', 'checked');
            }
        });
        $('#MainContent_ButtonInsc').click();
        if (aceptados>0) {
                $('#MainContent_ComentArea').text(config.pages.inscripcion.messages.responsabilidad);
                if (ramos!=aceptados) {
                $('#MainContent_ComentArea').text($('#MainContent_ComentArea').text()+config.pages.inscripcion.messages.novacantes);
                }
        } else {
            $('#MainContent_ComentArea').text(config.pages.inscripcion.messages.ningunavacante);
        }
    }
}

Workflow.Inscripcion_completarSolicitud = function ()
{
        $('#MainContent_Completar').click();
}

// lanzar bootstrap
$(function(){
    Workflow.bootstrap ();
});

window.openPost = function(url, variables)
{
    var form = document.createElement("form");
    form.setAttribute("method", "post");
    form.setAttribute("action", url);
    form.setAttribute("target", "_blank");
    for(variable in variables) {
        var hiddenField = document.createElement("input");
        hiddenField.setAttribute("type", "hidden");
        hiddenField.setAttribute("name", variable);
        hiddenField.setAttribute("value", variables[variable]);
        form.appendChild(hiddenField);
    }
    form.submit();
}