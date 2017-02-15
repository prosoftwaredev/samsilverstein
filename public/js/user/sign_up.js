/*
 Copyright (C) 2015  PencilBlue, LLC
 
 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.
 
 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.
 
 You should have received a copy of the GNU General Public License
 along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

function addSpaseForKeyboard() {
  /* this is for adding spasing when open keypoard on mobile devices*/
  var imkListener = '.imk-listener';
  var imkSpase = $('.indent-m-keyboard');
  var statusActive = 'open';
  var body = $('body');
  body
		  .on('focus', '.imk-listener', function () {
			imkSpase.addClass(statusActive);
			body.scrollTop(999999);
		  })
		  .on('blur', '.imk-listener', function () {
			imkSpase.removeClass(statusActive);
		  });
}


$(document).ready(function () {

  addSpaseForKeyboard();
  $('#sign_up_form').validate(
		  {
			rules:
					{
					  username:
							  {
								minlength: 2,
								required: true
							  },
					  email:
							  {
								email: true,
								required: true
							  },
					  password:
							  {
								required: true
							  },
					  confirm_password:
							  {
								required: true
							  }
					}
		  });
});

function resetUsernameAvailability() {
  $('#availability_button').attr('class', 'btn btn-default');
  $('#availability_button').html(loc.generic.CHECK);
}

function isValidateEmail(email) {
  var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

function resetUseremailAvailability() {
  $('#availability_button_email').attr('class', 'btn btn-default');
  if (isValidateEmail($('#email').val())) {
	$('#availability_button_email').html(loc.generic.CHECK);
  } else {
	$('#availability_button_email').html('Isn\'t valid');
  }
}

function validateUsername()
{
  if ($('#username').val().length === 0)
  {
	return;
  }

  $.getJSON('/api/user/get_username_available?username=' + $('#username').val(), function (response)
  {
	if (response.code === 0)
	{
	  if (response.data)
	  {
		$('#availability_button').attr('class', 'btn btn-success');
		$('#availability_button').html('<i class="fa fa-check"></i>&nbsp;' + loc.generic.AVAILABLE);
	  } else
	  {
		$('#availability_button').attr('class', 'btn btn-danger');
		$('#availability_button').html('<i class="fa fa-ban"></i>&nbsp;' + loc.generic.UNAVAILABLE);
	  }
	}
  });
}

function validateEmail() {
  if ($('#email').val().length === 0) {
	return;
  }
  $.getJSON('/api/user/get_useremail_available?email=' + $('#email').val(), function (response) {
	if (response.code === 0) {
	  if (response.data)
	  {
		$('#availability_button_email').attr('class', 'btn btn-success');
		$('#availability_button_email').html('<i class="fa fa-check"></i>&nbsp;' + loc.generic.AVAILABLE);
	  } else
	  {
		$('#availability_button_email').attr('class', 'btn btn-danger');
		$('#availability_button_email').html('<i class="fa fa-ban"></i>&nbsp;' + loc.generic.UNAVAILABLE);
	  }
	}
  });
}

function checkPasswordMatch()
{
  if ($('#password').val() != $('#confirm_password').val() || $('#password').val().length === 0)
  {
	$('#password_check').attr('class', 'fa fa-thumbs-down');
	$('#password_check').attr('style', 'color: #AA0000');
  } else
  {
	$('#password_check').attr('class', 'fa fa-thumbs-up');
	$('#password_check').attr('style', 'color: #00AA00');
  }
}
