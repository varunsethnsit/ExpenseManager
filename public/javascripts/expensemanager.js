var ExpenseEntries = [];
var FilterExpenseEntries = [];

var chart = [];

function getWeekNumber (thisdate){
    var d = new Date(+thisdate);
    d.setHours(0,0,0);
    d.setDate(d.getDate()+4-(d.getDay()||7));
    return Math.ceil((((d-new Date(d.getFullYear(),0,1))/8.64e7)+1)/7);
};

function CheckDuplicatePost( Post )
{
 //timezonename: timezonenameEntry, cityname:
/*	var timezone = Post.timezonename;
    var city = Post.cityname;

    $.each(TimeZoneEntries, function(index, value) {
    	if(value.timezonename == timezone && value.cityname == city)
        	return true;  

              /*var currDate = new Date(value.date);
              var entryDateString = currDate.toDateString();
              if(currDate>=fromDate && currDate<=toDate) {
                JogPostsFiltered.push(value);
                $('#JogEntryTable tbody').append("<tr bgcolor='#CEF6F5' align='center'><td>" + entryDateString + "</td><td>"+value.distance+"</td><td>" + value.time + "</td><td>" + value.speed + "</td></tr>");
              }*/

   /*  });
    return false;*/
}

function clearFormEntries() 
{
    $("#expensedescription").val('');
    $("#expensedate").val('');
    $("#expensetime").val('');
    $("#expenseamount").val('');
    $("#expensecomments").val('');
    $('.passerrormessage').hide();
    $('.regerrormessage').hide();
    $('.loginerrormessage').hide();
}

var socket = io.connect();

//todo check for duplicate post in add post
//todo add error messages while adding post
//todo add error messages while login

$(document).ready(function() {
    
    var rowHtml;
    var rowIndex = -1;
    var editingOn = 0;
    var rowCounter = 0;
    var rowdescription;
    var rowdate;
    var rowtime;
    var rowamount;
    var rowcomments;
    var buttonToggle = 0;

    socket.emit('GetUserName');
    socket.on('AcceptUserName', function(result) {
        if(result.username!='') {
          $('#loginbox').hide();
          $('#signupbox').hide();
          $('#entrybox').show();
          $('#loginname').text(result.username);
          socket.emit('GetAllPosts');
        } else {
          $('#loginbox').show();
        }
    });
    /* for Remember Password, add a condition to check that and then log out */

    $('#expensedate').datepicker();
  	$('#expensetime').timepicker();
    $('#expensetime').val('');

    socket.on('AcceptAllPosts', function(Items) {
        $('#ExpenseEntryTable tbody').empty();
        ExpenseEntries.length = 0;
        ExpenseEntries = [];
        var Entries = Items.Entries;
        Entries.forEach(function(entrydata){
            var descriptionEntry = entrydata.descriptionExp;
            var dateEntry = entrydata.dateExp;
            var timeEntry = entrydata.timeExp;
            var amountEntry = entrydata.amountExp;
            var commentsEntry = entrydata.commentsExp;
            $('#ExpenseEntryTable').append("<tr bgcolor='#CEF6F5' align='center'><td>" + descriptionEntry + "</td><td>" + dateEntry + "</td><td>" + timeEntry + "</td><td>$" + amountEntry + "</td><td>" + commentsEntry + "</td><td><a href='#entrybox' data-toggle='tooltip' title='Edit' class='editButton" + descriptionEntry + "'><span class='glyphicon glyphicon-edit'></span></a>&nbsp;&nbsp;&nbsp;&nbsp;<a href='#entrybox' data-toggle='tooltip' title='Delete' class='deleteButton" + descriptionEntry  + "'><span class='glyphicon glyphicon-remove-sign'></span></a></td></tr>");
            $(".editButton" + descriptionEntry).on("click", Edit);
            $(".deleteButton" + descriptionEntry).on("click", Delete);
            ExpenseEntries.push(entrydata);
        });
        
        if(chart!=null && typeof(chart)!='undefined' && chart.length!=0) {
            chart.clearChart();
        }
        if(ExpenseEntries.length!=0) {
            drawVisualization(ExpenseEntries);
        }
    });

    function drawVisualization(ChartEntries) 
    {
        var l = ChartEntries.length;
        var WeekNumbers = [];
      
        for(var i=0; i<l; i++) {
            var dateEntry = new Date(ChartEntries[i].dateExp);
            var weekNumber = getWeekNumber(dateEntry);
            var fullYear = dateEntry.getFullYear();
            var WeekOfYear = weekNumber + '-' + fullYear;
      
            if(WeekNumbers[WeekOfYear]!=null && WeekNumbers[WeekOfYear]!="") {
                WeekNumbers[WeekOfYear].amount += parseFloat(ChartEntries[i].amountExp);
            } else {
                WeekNumbers[WeekOfYear] = {amount: parseFloat(ChartEntries[i].amountExp)};
            }
        }

        var Arr = [['WeekOfYear', 'Total Amount[$]', 'Average Daily Expenditure[$]'],];
        for(var key in WeekNumbers) {
            var total_amount = parseFloat((WeekNumbers[key].amount).toFixed(2));
            var perday_amount = parseFloat((WeekNumbers[key].amount/7).toFixed(2));
            Arr.push([key, total_amount, perday_amount]);
        }
          
        var data = google.visualization.arrayToDataTable(Arr);

        var options = {
            title : 'Total expenditure & Average-daily expenditure Breakdown week-wise',
            vAxis: {title: "$"},
            hAxis: {title: "Week-of-Year (ith Week of yyyy Year)"},
            seriesType: "bars",
            series: {2: {type: "line"}}
        };

        chart = new google.visualization.ComboChart(document.getElementById('chart_div'));
        chart.draw(data, options);
    }

    function Save() 
    {
        var par = $(this).parent().parent();
       
        var descriptionExp = par.children("td:nth-child(1)");
        var dateExp = par.children("td:nth-child(2)");
        var timeExp = par.children("td:nth-child(3)");
        var amountExp = par.children("td:nth-child(4)");
        var commentsExp = par.children("td:nth-child(5)");
        var btns = par.children("td:nth-child(6)");
              
        var descriptionEntry = descriptionExp.children("input[type=text]").val();
        var dateEntry = dateExp.children("input[type=text]").val();
        var timeEntry = timeExp.children("input[type=text]").val();
        var amountEntry = amountExp.children("input[type=text]").val();
        var commentsEntry = commentsExp.children("textarea").val();
             
        if(descriptionEntry==rowdescription && dateEntry==rowdate && timeEntry==rowtime && amountEntry==rowamount && commentsEntry==rowcomments){
            console.log('Similar');
            return;
        }

        if(descriptionEntry=='' || dateEntry=='' || timeEntry=='' || amountEntry=='' || commentsEntry=='' || descriptionEntry==' ' || dateEntry==' ' || timeEntry==' ' || amountEntry==' ' || commentsEntry==' '){
            console.log('Empty fields');
            return;
        }

        socket.emit('SavePost', {descriptionExp: descriptionEntry, dateExp: dateEntry, timeExp: timeEntry, amountExp: amountEntry, commentsExp: commentsEntry, rowdescription: rowdescription, rowdate: rowdate, rowtime: rowtime, rowamount: rowamount, rowcomments: rowcomments});
        
        editrowHtml = "<td>" + descriptionEntry + "</td><td>" + dateEntry + "</td><td>" + timeEntry + "</td><td>$" + amountEntry + "</td><td>" + commentsEntry + "</td><td><a href='#entrybox' data-toggle='tooltip' title='Edit' class='editButton" + descriptionEntry + "'><span class='glyphicon glyphicon-edit'></span></a>&nbsp;&nbsp;&nbsp;&nbsp;<a href='#entrybox' data-toggle='tooltip' title='Delete' class='deleteButton" + descriptionEntry  + "'><span class='glyphicon glyphicon-remove-sign'></span></a></td></tr>";
        $('#ExpenseEntryTable tbody tr:eq(' + rowIndex + ')').html(editrowHtml);
        
        rowIndex = -1;
        $(".editButton" + descriptionEntry).on("click", Edit);
        $(".deleteButton" + descriptionEntry).on("click", Delete);    
    }

    function Delete() 
    {
        editingOn = 0;
        if(rowIndex!=-1) {
            $('#ExpenseEntryTable tbody tr:eq(' + rowIndex + ')').html(rowHtml);
            rowIndex = -1;
        }
        
        var par = $(this).parent().parent();
        var description = par.children("td:nth-child(1)");
        var descriptionEntry = description.text();
    
        socket.emit('DeletePost',{descriptionExp: descriptionEntry});
        socket.on('PostDeleted', function(result) {
            if(result.success==true) {
                par.remove();
                index=-1;
                for(i=0; i<ExpenseEntries.length; i++){
                    if(ExpenseEntries[i].descriptionExp == descriptionEntry) {
                        index = i;
                        break;
                    }
                }
                if(index!=-1) {
                    ExpenseEntries.splice(index, 1);
                }
                if(chart!=null && typeof(chart)!='undefined' && chart.length!=0) {
                    chart.clearChart();
                }
                if(ExpenseEntries.length!=0) {
                    drawVisualization(ExpenseEntries);
                }
            }
        });
    }

    function Cancel() 
    {
        editingOn = 0;
        $('#ExpenseEntryTable tbody tr:eq('+rowIndex+')').html(rowHtml);
        rowIndex = -1;
    }

    function Edit() 
    {
        currentrowIndex = parseInt($(this).parent().parent().index());
        
        if(rowIndex!=-1 && currentrowIndex!=rowIndex) {
            $('#ExpenseEntryTable tbody tr:eq(' + rowIndex + ')').html(rowHtml);
            var descriptionExpense = $('#ExpenseEntryTable tbody tr:eq(' + rowIndex + ')').children("td:nth-child(1)").text();
            $(".editButton" + descriptionExpense).on("click", Edit);
            $(".deleteButton" + descriptionExpense).on("click", Delete);
        }
                
        var par = $(this).parent().parent();
        var descriptionExp = par.children("td:nth-child(1)");
        var dateExp = par.children("td:nth-child(2)");
        var timeExp = par.children("td:nth-child(3)");
        var amountExp = par.children("td:nth-child(4)");
        var commentsExp = par.children("td:nth-child(5)");
        var btns = par.children("td:nth-child(6)");
  
        rowdescription = descriptionExp.text();
        rowdate = dateExp.text();
        rowtime = timeExp.text();
        rowamount = amountExp.text();
        rowcomments = commentsExp.text();
        rowHtml = par.html();
        rowIndex = parseInt($(this).parent().parent().index());
       
        var newamountExp = amountExp.html().substr(1,amountExp.html().length);
        var commentsExphtml = commentsExp.html();
        var dateExphtml = dateExp.html();
        var timeExphtml = timeExp.html();

        descriptionExp.html("<input type='text' class='form-control' required value='" + descriptionExp.html() + "'/>"); 
        dateExp.html("<input type='text' class='form-control' required id='expensedate1' value='" + dateExp.html() + "'/>"); 
        timeExp.html("<input type='text' class='form-control'  required id='expensetime1' value='" + timeExp.html() + "'/>"); 
        amountExp.html("<input type='text' class='form-control' required value='" + newamountExp + "'/>"); 
        commentsExp.html("<textarea class='form-control' required  id='commentsarea'></textarea>"); 

        btns.html("<a href='#entrybox' data-toggle='tooltip' title='Save' class='saveButton" + descriptionExp.text() + "'><span class='glyphicon glyphicon-save'></span></a>&nbsp;&nbsp;&nbsp;&nbsp;<a href='#entrybox' data-toggle='tooltip' title='Cancel' class='cancelButton'><span class='glyphicon glyphicon-remove" + descriptionExp.text() + "'></span></a>");
        
        $('#expensedate1').datepicker();
        $('#expensetime1').timepicker();
        $('#expensedate1').datepicker('setDate', dateExphtml);
        $('#expensetime1').timepicker('setTime', timeExphtml);
        $('#commentsarea').val(commentsExphtml);
        
        $(".saveButton" + descriptionExp.text()).bind("click", Save);
        $(".cancelButton" + descriptionExp.text()).bind("click", Cancel);
    }

    socket.on('RegisterResult', function(result) {
      $("#ruser").val('');
      $("#pass1").val('');
      $("#pass2").val('');

      if(result.success==true) {
          // show the main entry page.
          $('#loginbox').hide();
          $('#signupbox').hide();
          $('#entrybox').show();
          $('.regerrormessage').hide();
          $('#loginname').text(result.username);
          socket.emit('GetAllPosts');
      } else {
  //        console.log('Registration failed');
          $('.regerrormessage').show();
      }
    });

    socket.on('LoginResult', function(result) {
      if(result.success==true) {
        $("#luser").val('');
        $("#pass3").val('');
        $('#loginbox').hide();
        $('#signupbox').hide();
        $('#entrybox').show();
        $('.loginerrormessage').hide();
        $('#loginname').text(result.username);
        socket.emit('GetAllPosts');
      } else {
    //    console.log('Invalid login ! Try again');
        $('.loginerrormessage').show();
      }
    });
    
    socket.on('Loggedout', function(Entries) {
        $('#entrybox').hide(); 
        $('#loginbox').show();
        $('#loginname').val('');
        //destroy the login variable
    });

    socket.on('PostSaved', function(result) {
      if(result.success==true) {
        editingOn = 0;
        rowIndex = -1;
      }
    });

    socket.on('PostAdded', function(result) {
        if(result.success == true) {
            var entrydata = result.entry;
            var descriptionEntry = entrydata.descriptionExp;
            var dateEntry = entrydata.dateExp;
            var timeEntry = entrydata.timeExp;
            var amountEntry = entrydata.amountExp;
            var commentsEntry = entrydata.commentsExp;

            $('#ExpenseEntryTable').append("<tr bgcolor='#CEF6F5' align='center'><td>" + descriptionEntry + "</td><td>" + dateEntry + "</td><td>" + timeEntry + "</td><td>$" + amountEntry + "</td><td>" + commentsEntry + "</td><td><a href='#entrybox' data-toggle='tooltip' title='Edit' class='editButton" + descriptionEntry + "'><span class='glyphicon glyphicon-edit'></span></a>&nbsp;&nbsp;&nbsp;&nbsp;<a href='#entrybox' data-toggle='tooltip' title='Delete' class='deleteButton" + descriptionEntry  + "'><span class='glyphicon glyphicon-remove-sign'></span></a></td></tr>");
            $(".editButton" + descriptionEntry).on("click", Edit);
            $(".deleteButton" + descriptionEntry).on("click", Delete);
            ExpenseEntries.push(entrydata);
            
            if(chart!=null && typeof(chart)!='undefined' && chart.length!=0) {
                chart.clearChart();
            }
            if(ExpenseEntries.length!=0) {
                drawVisualization(ExpenseEntries);
            }
        }
    });
      

    $('#SignUpForm').submit(function() {
        var user = $("#ruser").val();
        var pass1 = $("#pass1").val();
        var pass2 = $("#pass2").val();
        //console.log('Pass1 and pass2 is ' + pass1 + ':' + pass2);
        $('.regerrormessage').hide();
        if(pass1!=pass2) {
          //console.log('invalid pass');
          //$('.error').hide();
          $('.passerrormessage').show();  
          return false;
        }
        $('.passerrormessage').hide();
        socket.emit('RegisterUser', { username: user, password: pass1 });
        return false;
    });

    $('#LoginForm').submit(function() {
        var user = $("#luser").val();
        var pass = $("#pass3").val();
        socket.emit('LoginUser', { username: user, password: pass });
        return false;
    });

    $('#Logoutlink').click(function() {
        socket.emit('Logout');
    });

    $('#filter').keyup(function() {
        var rex = new RegExp($(this).val(), 'i');
        $('.searchable tr').hide();
        FilterExpenseEntries = [];
        FilterExpenseEntries.length = 0;
        $('.searchable tr').filter(function() {
            var par = $(this);
            var descriptionEntry = par.children("td:nth-child(1)").text();
            var dateEntry = par.children("td:nth-child(2)").text();
            var timeEntry = par.children("td:nth-child(3)").text();
            var amountEntry = par.children("td:nth-child(4)").text();
            var commentsEntry = par.children("td:nth-child(5)").text();
            amountEntry = amountEntry.substr(1,amountEntry.length);
            var entrydata = {descriptionExp: descriptionEntry, dateExp: dateEntry, timeExp: timeEntry,amountExp: amountEntry,commentsExp: commentsEntry};
            
            if(rex.test($(this).text()) == true){
                FilterExpenseEntries.push(entrydata);
            }
            return rex.test($(this).text());
        }).show();

        if(FilterExpenseEntries.length==0){
            if(chart!=null && typeof(chart)!='undefined' && chart.length!=0){
                chart.clearChart();
            }
        } else {
            drawVisualization(FilterExpenseEntries);
        }
        //FilterExpenseEntries.length = 0;
        //FilterExpenseEntries = [];
    });


    $('#ExpenseEntry').submit(function() {
        var descriptionEntry = $("#expensedescription").val();
        var dateEntry = $("#expensedate").val();
        var timeEntry = $("#expensetime").val();
        var amountEntry = $("#expenseamount").val();
        var commentsEntry = $("#expensecomments").val();
        var ExpensePost = {descriptionExp: descriptionEntry, dateExp: dateEntry, timeExp: timeEntry, amountExp: amountEntry, commentsExp: commentsEntry};
        
        if(CheckDuplicatePost(ExpensePost)==true) {
                  ;//todo
        }
        //socket.emit('CheckDuplicate', { timezonename: timezonenameEntry, cityname: citynameEntry });
        socket.emit('AddPost', {descriptionExp: descriptionEntry, dateExp: dateEntry, timeExp: timeEntry, amountExp: amountEntry, commentsExp: commentsEntry});
        clearFormEntries();
        return false;
    });
    
    $('#ExpenseChartButton').click(function() {
        if(buttonToggle == 0) {
          $('#ExpenseChart').show();
          $('#ExpenseChartButton').val('Hide Expenses');
          $('#ExpenseChartButton').removeClass('btn-warning');
          $('#ExpenseChartButton').addClass('btn-info');
          buttonToggle = 1;
        } else {
          $('#ExpenseChart').hide();
          $('#ExpenseChartButton').val('Print Expenses');
          $('#ExpenseChartButton').removeClass('btn-info');
          $('#ExpenseChartButton').addClass('btn-warning');
          buttonToggle = 0;
        }
    });

});
