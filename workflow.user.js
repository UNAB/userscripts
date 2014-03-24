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

/**
 * Workflow UserScript
 * Copyright (C) Esteban De La Fuente Rubio, DeLaF (esteban[at]delaf.cl)
 *
 * Este programa es software libre: usted puede redistribuirlo y/o
 * modificarlo bajo los términos de la Licencia Pública General GNU
 * publicada por la Fundación para el Software Libre, ya sea la versión
 * 3 de la Licencia, o (a su elección) cualquier versión posterior de la
 * misma.
 *
 * Este programa se distribuye con la esperanza de que sea útil, pero
 * SIN GARANTÍA ALGUNA; ni siquiera la garantía implícita
 * MERCANTIL o de APTITUD PARA UN PROPÓSITO DETERMINADO.
 * Consulte los detalles de la Licencia Pública General GNU para obtener
 * una información más detallada.
 *
 * Debería haber recibido una copia de la Licencia Pública General GNU
 * junto a este programa.
 * En caso contrario, consulte <http://www.gnu.org/licenses/gpl.html>.
 */

/**
 * Para el uso del script se recomienda utilizar la extensión Tampermonkey
 * disponible en <http://tampermonkey.net>
 *
 * DISCLAIMER: El siguiente script interviene el código HTML una vez ha sido
 * descargado y ya renderizado en el navegador del usuario. NO SE CONECTA NI
 * INTERACTÚA DIRECTAMENTE DE NINGUNA FORMA CON EL SERVIDOR desde donde la web
 * es obtenida. Tampoco accede a datos del servidor de una forma que no sea la
 * ya entregada por la aplicación original, solo se simulan eventos que un
 * usuario podría realizar de forma manual (haciendo varios clicks por ejemplo)
 * con el objetivo de que dicho usuario reduzca su tiempo en el uso de la
 * interfaz original. Finalmente, EL AUTOR NO PUEDE NI SERÁ RESPONSABLE por el
 * uso que se de a este script, cada usuario deberá verificar por su cuenta los
 * datos antes de enviar los formularios. El usuario en cualquier momento podrá
 * deshabilitar, e incluso desintalar, el script de su navegador.
 */

var config = {
    'routes': {
        '/default.aspx': 'default',
        '/inscripcion.aspx': 'inscripcion',
        '/inscripcion2.aspx': 'inscripcion'
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
                'responsabilidad': 'Se acepta bajo exclusiva responsabilidad del alumno(a).',
                'novacantes': '\n\nRamos no inscritos es porque NRC especificados no disponían de vacantes.',
                'ningunavacante': 'Se rechaza solicitud puesto que NRC(s) solicitado(s) no tiene(n) vatante(s).',
                'rechazada': 'Se rechaza la solicitud.'
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
    Workflow['bootstrap_'+config.routes[window.location.pathname.toLowerCase()]] ();
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
    var filtroSolicitudes = new Array ();
    var n_solicitudes = 0;
    $("#MainContent_GridView1").dataTable().fnDestroy();
    $("#MainContent_GridView1 tbody tr > td > a").each(function () {
        // extraer datos del enlace
        var data = $(this).text().split('-');
        var solicitud = data[0];
        var run = data[1].split(' ')[0];
        var alumno = data[1].split(/ (.+)/)[1];
        var periodo = data[2];
        var folio = data[3];
        // agregar datos a los filtros
        if ($.inArray(solicitud, filtroSolicitudes)==-1)
                filtroSolicitudes.push(solicitud);
        // agregar título al enlace con los datos ordenados de la solicitud
        $(this).attr('title', 'FOLIO: '+folio+'\nPERÍODO: '+periodo+'\nSOLICITUD: '+solicitud+'\nALUMNO: '+alumno+' ('+run+')');
        // cambiar comportamiento del enlace
        $(this).attr('href', $(this).attr('href').replace('__doPostBack', 'Workflow.solicitud_abrir')+'; return false');
        $(this).click (Workflow.solicitud_abrir);
        // sumar solicitudes
        n_solicitudes++;
    });
    // mostrar total de solicitudes pendientes
    $('#Workflow_header').append('Solicitudes = <span id="n_solicitudes">'+n_solicitudes+'</span><br />');
    // crear filtros
    $('#Workflow_header').append('Filtros: ');
    filtroSolicitudes.sort();
    $('#Workflow_header').append('<select id="filtroSolicitudes" name="filtroSolicitudes">');
    $('#filtroSolicitudes').change(Workflow.Solicitudes_filtrarPorSolicitud);
    $('#filtroSolicitudes').append('<option value="">Seleccionar un tipo de solicitud para filtrar</option>');
    for(solicitud in filtroSolicitudes) {
        $('#filtroSolicitudes').append('<option value="'+filtroSolicitudes[solicitud]+'">'+filtroSolicitudes[solicitud]+'</option>');
    }
    $('#Workflow_header').append('</select>');
}

Workflow.Solicitudes_filtrarPorSolicitud = function () {
    var n_solicitudes = 0;
    var filtro = $("#filtroSolicitudes").val();
        $("#MainContent_GridView1 tbody tr > td > a").each(function () {
        var solicitud = $(this).text().split('-')[0];
        if (solicitud==filtro || filtro=='') {
                n_solicitudes++;
            $(this).parent().parent().css('display', 'table-row');
        } else {
            $(this).parent().parent().css('display', 'none');
        }
    });
    $('#n_solicitudes').text(n_solicitudes);
}

Workflow.solicitud_abrir = function (evt) {
    $('a[href='+evt.target.href+']').parent().parent().remove();
    var params = evt.target.href.replace("javascript:Workflow.solicitud_abrir('", '').replace("'); return false", '').split("','");
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
    $('#Workflow_header').append('<input type="button" id="rechazarRamos" value="Rechazar todos los ramos" accesskey="r" /> ');
    $('#Workflow_header').append('<input type="button" id="completarSolicitud" value="Completar la solicitud" accesskey="c" /> ');
    $('#Workflow_header').append('<a href="'+$('a[target=blank]').attr('href')+'" target="_blank" style="color:orange;text-decoration:underline">FICHA DEL ALUMNO</a> ');
    $("html, body").animate({ scrollTop: $('#MainContent_LblSolicitud').parent().parent().parent().parent().parent().parent().offset().top }, 500);
    $("#aceptarRamos").click (Workflow.Inscripcion_aceptarRamos);
    $("#rechazarRamos").click (Workflow.Inscripcion_rechazarRamos);
    $("#completarSolicitud").click (Workflow.Inscripcion_completarSolicitud);
    // mostrar "otros horarios"
    /*$('#MainContent_GridInsc tr:gt(0)').each(function () {
        $('td:eq(1) input', this).click();
    });*/
    // detectar si hubo error al completar la solicitud y hacer click nuevamente para volver a completar
    if ($('#MainContent_V_ERROR').length &&  $('#MainContent_V_ERROR').text()==config.pages.inscripcion.errors.nocompletada) {
        $("html, body").animate({ scrollTop: $('#MainContent_V_ERROR').offset().top }, 500);
        $('#MainContent_Completar').click();
    }
}

Workflow.Inscripcion_aceptarRamos = function ()
{
    $("#aceptarRamos").attr("disabled", "disabled");
    $("#rechazarRamos").attr("disabled", "disabled");
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

Workflow.Inscripcion_rechazarRamos = function ()
{
    $("#aceptarRamos").attr("disabled", "disabled");
    $("#rechazarRamos").attr("disabled", "disabled");
    if ($('#MainContent_ButtonInsc').is(':disabled')==false) {
        $('#MainContent_ButtonInsc').click();
            $('#MainContent_ComentArea').text(config.pages.inscripcion.messages.rechazada);
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

/**
 * Función para enviar un formulario por POST abriéndolo en
 * una nueva ventana.
 */
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
