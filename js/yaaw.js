/*
 * Copyright (C) 2015 Binux <roy@binux.me>
 *
 * This file is part of YAAW (https://github.com/binux/yaaw).
 *
 * YAAW is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.
 *
 * YAAW is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Lesser General Public License for more details.
 *
 * You may get a copy of the GNU Lesser General Public License
 * from http://www.gnu.org/licenses/lgpl.txt
 *
 */

var YAAW = (function() {
	var selected_tasks = false;
	var on_gid = null;
	var torrent_file = null, file_type = null;
	return {
		init: function() {
			$('#main-control').show();

			this.tpl.init();
			this.setting.init();
			this.contextmenu.init();
			this.event_init();
			this.aria2_init();
		},

		aria2_init: function() {
			ARIA2.init(this.setting.jsonrpc_path, function() {
				if (YAAW.setting.add_task_option) {
					$("#add-task-option-wrap").empty().append(YAAW.tpl.add_task_option(YAAW.setting.add_task_option));
				} else {
					ARIA2.init_add_task_option();
				}
				ARIA2.refresh();
				ARIA2.auto_refresh(YAAW.setting.refresh_interval);
				ARIA2.finish_notification = YAAW.setting.finish_notification;
				ARIA2.get_version();
				ARIA2.global_stat();
			});
		},

		event_init: function() {
			$("#add-task-submit").live("click", function() {
				YAAW.add_task.submit();return false;
			});
			$("#add-task-uri").submit(function() {
				YAAW.add_task.submit();return false;
			});
			$("#saveSettings").live("click", function() {
				YAAW.setting.submit();return false;
			});
			$("#setting-form").submit(function() {
				YAAW.setting.submit();return false;
			});
			$("#add-task-clear").live("click", function() {
				YAAW.add_task.clean();
			});
			$("#btnRemove").live("click", function() {
				YAAW.tasks.remove();YAAW.tasks.unSelectAll();
			});
			$("#btnPause").live("click", function() {
				YAAW.tasks.pause();YAAW.tasks.unSelectAll();
			});
			$("#btnUnPause").live("click", function() {
				YAAW.tasks.unpause();YAAW.tasks.unSelectAll();
			});
			$("#btnClearAlert").live("click", function() {
				$('#main-alert').hide();
			});
			$("#btnSelectActive").live("click", function() {
				YAAW.tasks.selectActive();
			});
			$("#btnSelectWaiting").live("click", function() {
				YAAW.tasks.selectWaiting();
			});
			$("#btnSelectPaused").live("click", function() {
				YAAW.tasks.selectPaused();
			});
			$("#btnSelectStopped").live("click", function() {
				YAAW.tasks.selectStopped();
			});
			$("#btnStartAll").live("click", function() {
				ARIA2.unpause_all();
			});
			$("#btnPauseAll").live("click", function() {
				ARIA2.pause_all();
			});
			$("#btnRemoveFinished").live("click", function() {
				ARIA2.purge_download_result();
			});
			$("#closeAlert").live("click", function() {
				$('#add-task-alert').hide();
			});
			$("#menuMoveTop").live("click", function() {
				YAAW.contextmenu.movetop();
			});
			$("#menuMoveUp").live("click", function() {
				YAAW.contextmenu.moveup();
			});
			$("#menuMoveDown").live("click", function() {
				YAAW.contextmenu.movedown();
			});
			$("#menuMoveEnd").live("click", function() {
				YAAW.contextmenu.moveend();
			});
			$("#menuRestart").live("click", function() {
				YAAW.contextmenu.restart();
			});
			$("#menuStart").live("click", function() {
				YAAW.contextmenu.unpause();
			});
			$("#menuPause").live("click", function() {
				YAAW.contextmenu.pause();
			});
			$("#menuRemove").live("click", function() {
				YAAW.contextmenu.remove();
			});

			$("[rel=tooltip]").tooltip({"placement": "bottom"});

			$(".task .select-box").live("click", function() {
				YAAW.tasks.toggle($(this).parents(".task"));
				YAAW.tasks.check_select();
			});

			$(".task .task-name > span").live("click", function() {
				var task = $(this).parents(".task");
				if (task.hasClass("info-open")) {
					YAAW.tasks.info_close();
				} else {
					YAAW.tasks.info_close();
					YAAW.tasks.info(task);
				}
			});

			$("#uri-more").click(function() {
				$("#add-task-uri .input-append").toggle();
				$("#uri-textarea").toggle();
				$("#uri-more .or-and").toggle();
				$("#uri-input").val("");
				$("#uri-textarea").val("");
				$("#ati-out").parents(".control-group").val("").toggle();
			});

			$("#ib-files .ib-file-title, #ib-files .select-box").live("click", function() {
				if ($(this).parent().find(".select-box:first").hasClass("icon-ok")) {
					$(this).parent().find(".select-box").removeClass("icon-ok");
				} else {
					$(this).parent().find(".select-box").addClass("icon-ok");
				}
			});

			$("#ib-file-save").live("click", function() {
				var indexes = [];
				$("#ib-files .select-box.icon-ok[data-index]").each(function(i, n) {
					indexes.push(n.getAttribute("data-index"));
				});
				if (indexes.length == 0) {
					ARIA2.main_alert("alert-error", "至少有一个文件应该被选中或者只是停止此任务", 5000);
				} else {
					var options = {
						"select-file": indexes.join(","),
					};
					ARIA2.change_option($(this).parents(".info-box").attr("data-gid"), options);
				};
			});

			$("#ib-options-a").live("click", function() {
				ARIA2.get_options($(".info-box").attr("data-gid"));
			});

			$("#ib-peers-a").live("click", function() {
				ARIA2.get_peers($(".info-box").attr("data-gid"));
			});

			var active_task_allowed_options = ["max-download-limit", "max-upload-limit"];
			$("#ib-options-save").live("click", function() {
				var options = {};
				var gid = $(this).parents(".info-box").attr("data-gid")
				var status = $("#task-gid-"+gid).attr("data-status");
				$.each($("#ib-options-form input"), function(n, e) {
					if (status == "active" && active_task_allowed_options.indexOf(e.name) == -1)
						return;
					options[e.name] = e.value;
				});
				ARIA2.change_options($(".info-box").attr("data-gid"), options);
			});

			$("#select-all-btn").click(function() {
				if (selected_tasks) {
					YAAW.tasks.unSelectAll();
				} else {
					YAAW.tasks.selectAll();
				}
			});

			$("#refresh-btn").click(function() {
				YAAW.tasks.unSelectAll();
				YAAW.tasks.info_close();
				$("#main-alert").hide();
				ARIA2.refresh();
				return false;
			});

			$("#setting-modal").on("show", function() {
				ARIA2.get_global_option();
			});

			if (window.FileReader) {
				var holder = $("#add-task-modal .modal-body").get(0);
				holder.ondragover = function() {
					$(this).addClass("hover");
					return false;
				}
				holder.ondragend = function() {
					$(this).removeClass("hover");
					return false;
				}
				holder.ondrop = function(e) {
					$(this).removeClass("hover");
					e.preventDefault();
					var file = e.dataTransfer.files[0];
					YAAW.add_task.upload(file);
					return false;
				}

				var tup = $("#torrent-up-input").get(0);
				tup.onchange = function(e) {
					var file = e.target.files[0];
					YAAW.add_task.upload(file);
				}
			} else {
				$("#torrent-up-input").remove();
				$("#torrent-up-btn").addClass("disabled").tooltip({title: "当前浏览器不支持 File API."});
			}

			if (window.applicationCache) {
				var appcache = window.applicationCache;
				$(document).ready(function() {
					if (appcache.status == appcache.IDLE)
						$("#offline-cached").text("cached");
				});
				appcache.addEventListener("cached", function(){
					$("#offline-cached").text("cached");
				});
			}
		},

		tpl: {
			init: function() {
				var _this = this;
				$("script[type='text/mustache-template']").each(function(i, n) {
					var key = n.getAttribute("id").replace(/-tpl$/, "").replace(/-/g, "_");
					_this[key] = function() {
						var tpl = Mustache.compile($(n).text());
						return function(view) {
							view._v = _this.view;
							return tpl(view);
						};
					}();
				});
			},

			files_tree: function(files) {
				var file_dict = {}, f;
				for (var i = 0; i < files.length; i++) {
					var at = files[i].title.split('/');
					f = file_dict;
					for (var j = 0; j < at.length; j++) {
						f[at[j]] = f[at[j]] || {};
						f = f[at[j]];
					}
					f['_file'] = files[i];
				}

				function render(f) {
					var content = '<ul>';

					for (var k in f) {
						if (f[k]['_file'] !== undefined) {
							continue;
						}

						content += '<li>';
						content += '<i class="select-box icon-ok"></i>';
						content += '<span class="ib-file-title">'+$('<div>').text(k).html()+'</span>';
						content += render(f[k]);
						content += '</li>';
					}

					for (k in f) {
						if (f[k]['_file'] === undefined) {
							continue;
						}

						f[k]['_file']['relative_title'] = k;
						content += YAAW.tpl.file(f[k]['_file']);
					}
					content += '</ul>';
					return content;
				}
				
				//console.log(file_dict);
				return render(file_dict);
			},

			view: {
				bitfield: function() {
					var graphic = "░▒▓█";
					return function(text) {
						var len = text.length;
						var result = "";
						for (var i=0; i<len; i++)
							result += graphic[Math.floor(parseInt(text[i], 16)/4)] + "&#8203;";
						return result;
					};
				},

				bitfield_to_10: function() {
					var graphic = "░▒▓█";
					return function(text) {
						var len = text.length;
						var part_len = Math.ceil(len/10);
						var result = "";
						for (var i=0; i<10; i++) {
							p = 0;
							for (var j=0; j<part_len; j++) {
								if (i*part_len+j >= len)
									p += 16;
								else
									p += parseInt(text[i*part_len+j], 16);
							}
							result += graphic[Math.floor(p/part_len/4)] + "&#8203;";
						}
						return result;
					};
				},

				bitfield_to_percent: function() {
					return function(text) {
						var len = text.length - 1;
						var p, one = 0;
						for (var i=0; i<len; i++) {
							p = parseInt(text[i], 16);
							for (var j=0; j<4; j++) {
								one += (p & 1);
								p >>= 1;
							}
						}
						return Math.floor(one/(4*len)*100).toString();
					};
				},

				format_size: function() {
					var format_text = ["B", "KiB", "MiB", "GiB", "TiB", ];
					return function(size) {
						if (size === '') return '';
						size = parseInt(size);
						var i = 0;
						while (size >= 1024) {
							size /= 1024;
							i++;
						}
						if (size==0) {
							return "0 KiB";
						} else {
							return size.toFixed(2)+" "+format_text[i];
						}
					};
				},

				format_size_0: function() {
					var format_text = ["B", "KiB", "MiB", "GiB", "TiB", ];
					return function(size) {
						if (size === '') return '';
						size = parseInt(size);
						var i = 0;
						while (size >= 1024) {
							size /= 1024;
							i++;
						}
						if (size==0) {
							return "0 KiB";
						} else {
							return size.toFixed(0)+" "+format_text[i];
						}
					};
				},

				format_time: function() {
					var time_interval = [60, 60, 24];
					var time_text = ["s", "m", "h"];
					return function(time) {
						if (time == Infinity) {
							return "INF";
						} else if (time == 0) {
							return "0s";
						}

						time = Math.floor(time);
						var i = 0;
						var result = "";
						while (time > 0 && i < 3) {
							result = time % time_interval[i] + time_text[i] + result;
							time = Math.floor(time/time_interval[i]);
							i++;
						}
						if (time > 0) {
							result = time + "d" + result;
						}
						return result;
					};
				},

				format_date: function() {
					return function(u) {
						var d, t, _pad;
						_pad = function(n) {
							return (n < 10 ? "0" : "") + n;
						};
						d = new Date(isNaN(parseInt(u, 10)) ? 0 : parseInt(u, 10) * 1e3);
						return [
							[
								_pad(d.getFullYear()),
								_pad(d.getMonth() + 1),
								_pad(d.getDate())
							].join("-"),
							[
								_pad(d.getHours()),
								_pad(d.getMinutes()),
								_pad(d.getSeconds())
							].join(":")
						].join(" ");
					};
				},

				format_peerid: function() {
					return function(peerid) {
						try {
							var ret = window.format_peerid(peerid);
							if (ret.client == 'unknown') throw 'unknown';
							return ret.client+(ret.version ? '-'+ret.version : '');
						} catch(e) {
							if (peerid == '%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00')
								return 'unknown';
							var ret = unescape(peerid).split('-');
							for (var i=0; i<ret.length; i++) {
								if (ret[i].trim().length) return ret[i];
							}
							return 'unknown';
						}
					}
				},

				error_msg: function() {
					var error_code_map = {
						0: "",
						1: "发生未知错误",
						2: "操作超时.",
						3: "资源未找到.",
						4: "资源未找到. 参见 --max-file-not-found 选项.",
						5: "资源未找到. 参见 --lowest-speed-limit 选项.",
						6: "网络出现问题.",
						7: "未完成下载.",
						8: "远程服务器不支持断点续传.",
						9: "磁盘空间不足.",
						10: "分块大小与.aria2文件中不同. 参见 --allow-piece-length-change 选项.",
						11: "Aria2 正在下载相同的文件.",
						12: "Aria2 正在下载相同的BT任务.",
						13: "文件已存在. 参见 --allow-overwrite 选项.",
						14: "文件重命名失败. 参见 --auto-file-renaming 选项.",
						15: "Aria2 无法打开当前文件.",
						16: "Aria2 无法创建新文件或截断现有文件.",
						17: "发生 I/O 错误.",
						18: "Aria2 无法创建文件夹.",
						19: "名称解析失败.",
						20: "无法解析的 Metalink 文件.",
						21: "FTP 命令执行失败.",
						22: "HTTP 请求头错误或者无效.",
						23: "重定向过多.",
						24: "HTTP 授权失败.",
						25: "Aria2 无法解析 Bencoded 编码文件 (通常是 BT种子文件).",
						26: "BT种子文件损坏或者 Aria2无法读取需要的信息.",
						27: "损坏的磁力链接.",
						28: "错误的参数或者无法识别的选项.",
						29: "因暂时超载或维护, 远程服务器无法处理请求.",
						30: "Aria2 无法解析 JSON-RPC 请求.",
					};
					return function(text) {
						return error_code_map[text] ? " " + error_code_map[text] : "";
					};
				},

				status_icon: function() {
					var status_icon_map = {
						active: "icon-download-alt",
						waiting: "icon-time",
						paused: "icon-pause",
						error: "icon-remove",
						complete: "icon-ok",
						removed: "icon-trash",
					};
					return function(text) {
						return status_icon_map[text] || "";
					};
				},

				status_text: function() {
					var status_text_map = {
						active: "下载中",
						waiting: "等待中",
						paused: "已暂停",
						error: "下载出错",
						complete: "下载完成",
						removed: "已删除",
					};
					return function(text) {
						return status_text_map[text] || "";
					};
				},
			},
		},

		add_task: {
			submit: function(_this) {
				var uri = $("#uri-input").val() || $("#uri-textarea").val() && $("#uri-textarea").val().split("\n") ;
				var options = {}, options_save = {};
				$("#add-task-option input[name], #add-task-option textarea[name]").each(function(i, n) {
					var name = n.getAttribute("name");
					var value = (n.type == "checkbox" ? n.checked : n.value);
					if (name && value) {
						options[name] = String(value);
						if ($(n).hasClass("input-save")) {
							options_save[name] = String(value);
						}
					}
				});

				if (uri) {
					ARIA2.madd_task(uri, options);
					YAAW.setting.save_add_task_option(options_save);
				} else if (torrent_file) {
					if (file_type.indexOf("metalink") != -1) {
						ARIA2.add_metalink(torrent_file, options);
					} else {
						ARIA2.add_torrent(torrent_file, options);
					}
					YAAW.setting.save_add_task_option(options_save);
				}
			},

			clean: function() {
				$("#uri-input").attr("placeholder", "输入HTTP, FTP 或 Magnet 链接");
				$("#add-task-modal .input-clear").val("");
				$("#add-task-alert").hide();
				torrent_file = null;
				file_type = null;
			},

			upload: function(file) {
				var reader = new FileReader();
				reader.onload = function(e) {
					$("#uri-input").attr("placeholder", file.name);
					torrent_file = e.target.result.replace(/.*?base64,/, "");
					file_type = file.type;
				};
				reader.onerror = function(e) {
					$("#torrent-up-input").remove();
					$("#torrent-up-btn").addClass("disabled");
				};
				reader.readAsDataURL(file);
			},
		},

		tasks: {
			check_select: function() {
				var selected = $(".tasks-table .task.selected");
				if (selected.length == 0) {
					selected_tasks = false;
					$("#select-btn .select-box").removeClass("icon-minus icon-ok");
				} else if (selected.length < $(".tasks-table .task").length) {
					selected_tasks = true;
					$("#select-btn .select-box").removeClass("icon-ok").addClass("icon-minus");
				} else {
					selected_tasks = true;
					$("#select-btn .select-box").removeClass("icon-minus").addClass("icon-ok");
				}

				if (selected.length + $(".info-box").length == 0) {
					ARIA2.select_lock(false);
				} else {
					ARIA2.select_lock(true);
				}

				if (selected_tasks) {
					$("#not-selected-grp").hide();
					$("#selected-grp").show();
				} else {
					$("#not-selected-grp").show();
					$("#selected-grp").hide();
				}
			},

			select: function(task) {
				$(task).addClass("selected").find(".select-box").addClass("icon-ok");
			},

			unSelect: function(task) {
				$(task).removeClass("selected").find(".select-box").removeClass("icon-ok");
			},

			toggle: function(task) {
				$(task).toggleClass("selected").find(".select-box").toggleClass("icon-ok");
			},

			unSelectAll: function(notupdate) {
				var _this = this;
				$(".tasks-table .task.selected").each(function(i, n) {
					_this.unSelect(n);
				});
				if (!notupdate)
					this.check_select();
			},

			selectAll: function() {
				var _this = this;
				$(".tasks-table .task").each(function(i, n) {
					_this.select(n);
				});
				this.check_select();
			},

			selectActive: function() {
				var _this = this;
				this.unSelectAll(true);
				$(".tasks-table .task[data-status=active]").each(function(i, n) {
					_this.select(n);
				});
				this.check_select();
			},

			selectWaiting: function() {
				var _this = this;
				this.unSelectAll(true);
				$(".tasks-table .task[data-status=waiting]").each(function(i, n) {
					_this.select(n);
				});
				this.check_select();
			},

			selectPaused: function() {
				var _this = this;
				this.unSelectAll(true);
				$(".tasks-table .task[data-status=paused]").each(function(i, n) {
					_this.select(n);
				});
				this.check_select();
			},

			selectStopped: function() {
				var _this = this;
				this.unSelectAll(true);
				$("#stopped-tasks-table .task").each(function(i, n) {
					_this.select(n);
				});
				this.check_select();
			},

			getSelectedGids: function() {
				var gids = new Array();
				$(".tasks-table .task.selected").each(function(i, n) {
					gids.push(n.getAttribute("data-gid"));
				});
				return gids;
			},

			pause: function() {
				var gids = new Array();
				$(".tasks-table .task.selected").each(function(i, n) {
					if (n.getAttribute("data-status") == "active" ||
						n.getAttribute("data-status") == "waiting")
						gids.push(n.getAttribute("data-gid"));
				});
				if (gids.length) ARIA2.pause(this.getSelectedGids());
			},

			unpause: function() {
				var gids = new Array();
				var stopped_gids = new Array();
				$(".tasks-table .task.selected").each(function(i, n) {
					var status = n.getAttribute("data-status");
					if (status == "paused") {
						gids.push(n.getAttribute("data-gid"));
					} else if ("removed/error".indexOf(status) != -1) {
						stopped_gids.push(n.getAttribute("data-gid"));
					}
				});
				if (gids.length) ARIA2.unpause(gids);
				if (stopped_gids.length) ARIA2.restart_task(stopped_gids);
			},

			remove: function() {
				var gids = new Array();
				var remove_list = ["active", "waiting", "paused"];
				var remove_gids = new Array();
				$(".tasks-table .task.selected").each(function(i, n) {
					if (remove_list.indexOf(n.getAttribute("data-status")) != -1)
						remove_gids.push(n.getAttribute("data-gid"));
					else
						gids.push(n.getAttribute("data-gid"));
				});
				if (remove_gids.length) ARIA2.remove(remove_gids);
				if (gids.length) ARIA2.remove_result(gids);
			},

			info: function(task) {
				task.addClass("info-open");
				task.after(YAAW.tpl.info_box({gid: task.attr("data-gid")}));
				if (task.parents("#stopped-tasks-table").length) {
					$("#ib-options-a").hide();
				}
				ARIA2.get_status(task.attr("data-gid"));
				ARIA2.select_lock(true);
			},

			info_close: function(task) {
				$(".info-box").remove();
				$(".info-open").removeClass("info-open");

				if ($(".tasks-table .task.selected").length == 0) {
					ARIA2.select_lock(false);
				} else {
					ARIA2.select_lock(true);
				}
			},
		},

		contextmenu: {
			init: function() {
				$(".task").live("contextmenu", function(ev) {
					var contextmenu_position_y = ev.clientY
					var contextmenu_position_x = ev.clientX;
					if ($(window).height() - ev.clientY < 200) {
						contextmenu_position_y = ev.clientY - $("#task-contextmenu").height();
					}
					if ($(window).width() - ev.clientX < 200) {
						contextmenu_position_x = ev.clientX - $("#task-contextmenu").width();
					}
					$("#task-contextmenu").css("top", contextmenu_position_y)
					.css("left", contextmenu_position_x).show();
					on_gid = ""+this.getAttribute("data-gid");

					var status = this.getAttribute("data-status");
					if (status == "waiting" || status == "paused") {
						$("#task-contextmenu .task-move").show();
					} else {
						$("#task-contextmenu .task-move").hide();
					}
					if (status == "removed" || status == "complete" || status == "error") {
						$(".task-restart").show();
						$(".task-start").hide();
					} else {
						$(".task-restart").hide();
						$(".task-start").show();
					}
					if (status != "waiting" || status != "active") {
						$(".task-pause").hide();
					} else {
						$(".task-pause").show();
					}
					return false;
				}).live("mouseout", function(ev) {
					// toElement is not available in Firefox, use relatedTarget instead.
					var enteredElement = ev.toElement || ev.relatedTarget;
					if ($.contains(this, enteredElement) ||
						$("#task-contextmenu").get(0) == enteredElement ||
						$.contains($("#task-contextmenu").get(0), enteredElement)) {
						return;
					}
					on_gid = null;
					$("#task-contextmenu").hide();
				});

				$("#task-contextmenu a").click(function() {
					$("#task-contextmenu").hide();
				});
				var mouse_on = false;
				$("#task-contextmenu").hover(function() {
					mouse_on = true;
				}, function() {
					if (mouse_on) {
						on_gid = null;
						$("#task-contextmenu").hide();
					}
				});

			},

			restart: function() {
				if (on_gid) ARIA2.restart_task([on_gid, ]);
				on_gid = null;
			},

			pause: function() {
				if (on_gid) ARIA2.pause(on_gid);
				on_gid = null;
			},

			unpause: function() {
				if (on_gid) ARIA2.unpause(on_gid);
				on_gid = null;
			},

			remove: function() {
				var remove_list = ["active", "waiting", "paused"];
				if (on_gid) {
					if (remove_list.indexOf(status) !== -1) {
						ARIA2.remove(on_gid);
					} else {
						ARIA2.remove_result(on_gid);
					}
				}
				on_gid = null;
			},

			movetop: function() {
				if (on_gid) ARIA2.change_pos(on_gid, 0, 'POS_SET');
				on_gid = null;
			},

			moveup: function() {
				if (on_gid) ARIA2.change_pos(on_gid, -1, 'POS_CUR');
				on_gid = null;
			},

			movedown: function() {
				if (on_gid) ARIA2.change_pos(on_gid, 1, 'POS_CUR');
				on_gid = null;
			},

			moveend: function() {
				if (on_gid) ARIA2.change_pos(on_gid, 0, 'POS_END');
				on_gid = null;
			},

		},

		setting: {
			init: function() {
				this.jsonrpc_path = $.Storage.get("jsonrpc_path") || (/^http/.test(location.protocol) ? location.protocol : "http:") + "//localhost:6800/jsonrpc";
				this.refresh_interval = Number($.Storage.get("refresh_interval") || 3000);
				this.finish_notification = Number($.Storage.get("finish_notification") || 0);
				this.add_task_option = $.Storage.get("add_task_option");
				this.jsonrpc_history = JSON.parse($.Storage.get("jsonrpc_history") || "[]");
				if (this.add_task_option) {
					this.add_task_option = JSON.parse(this.add_task_option);
				}
				// overwrite settings with hash
				if (location.hash && location.hash.length) {
					var args = location.hash.substring(1).split('&'), kwargs = {};
					$.each(args, function(i, n) {
						n = n.split('=', 2);
						kwargs[n[0]] = n[1];
					});

					if (kwargs['path']) this.jsonrpc_path = kwargs['path'];
					this.kwargs = kwargs;
				}

				var _this = this;
				$('#setting-modal').on('hidden', function () {
					_this.update();
				});

				this.update();
			},

			save_add_task_option: function(options) {
				this.add_task_option = options;
				$.Storage.set("add_task_option", JSON.stringify(options));
			},

			save: function() {
				$.Storage.set("jsonrpc_path", this.jsonrpc_path);
				if (this.jsonrpc_history.indexOf(this.jsonrpc_path) == -1) {
					if (this.jsonrpc_history.push(this.jsonrpc_path) > 10) {
						this.jsonrpc_history.shift();
					}
					$.Storage.set("jsonrpc_history", JSON.stringify(this.jsonrpc_history));
				}
				$.Storage.set("refresh_interval", String(this.refresh_interval));
				if (this.finish_notification == 1) {
					if (!window.Notification) {
						this.finish_notification == 0;
					} else {
						window.Notification.requestPermission();
					}
				}
				$.Storage.set("finish_notification", String(this.finish_notification));
			},

			update: function() {
				$("#setting-form #rpc-path").val(this.jsonrpc_path);
				$("#setting-form input:radio[name=refresh_interval][value="+this.refresh_interval+"]").attr("checked", true);
				$("#setting-form input:radio[name=finish_notification][value="+this.finish_notification+"]").attr("checked", true);
				if (this.jsonrpc_history.length) {
					var content = '<ul class="dropdown-menu">';
					$.each(this.jsonrpc_history, function(n, e) {
						content += '<li><a href="javascript:;">'+e+'</a></li>';
					});
					content += '</ul>';
					$(".rpc-path-wrap").append(content).on("click", "li>a", function() {
						$("#setting-form #rpc-path").val($(this).text());
					});
					$(".rpc-path-wrap .dropdown-toggle").removeAttr("disabled").dropdown();
				}
			},

			submit: function() {
				_this = $("#setting-form");
				var _jsonrpc_path = _this.find("#rpc-path").val();
				var _refresh_interval = Number(_this.find("input:radio[name=refresh_interval]:checked").val());
				var _finish_notification = Number(_this.find("input:radio[name=finish_notification]:checked").val());

				var changed = false;
				if (_jsonrpc_path !== undefined && this.jsonrpc_path != _jsonrpc_path) {
					this.jsonrpc_path = _jsonrpc_path;
					YAAW.tasks.unSelectAll();
					$("#main-alert").hide();
					YAAW.aria2_init();
					changed = true;
				}
				if (_refresh_interval !== undefined && this.refresh_interval != _refresh_interval) {
					this.refresh_interval = _refresh_interval;
					ARIA2.auto_refresh(this.refresh_interval);
					changed = true;
				}
				if (_finish_notification !== undefined && this.finish_notification != _finish_notification) {
					this.finish_notification = _finish_notification;
					ARIA2.finish_notification = _finish_notification;
					changed = true;
				}
				if (changed) {
					this.save();
				}

				// submit aria2 global setting
				var options = {};
				$("#aria2-gs-form input[name]").each(function(i, n) {
					var name = n.getAttribute("name");
					var value = n.value;
					if (name && value)
						options[name] = value;
				});
				ARIA2.change_global_option(options);
				$("#setting-modal").modal('hide');
			},
		},

		notification: function(title, content) {
			if (!window.Notification) {
				return false;
			}

			var notification = new window.Notification(title, {
				body: content,
				icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAADtElEQVRoQ+2ZjXHTQBCF4wqACnAqgFSAqQBSAXYFQAU4FQAVYFcQUgFOBSQV4A6ACmA/za3m5aKTTifZTma8Mze2TqfVe/vvZHLyyGXyyPGfHAnswINPTec3W28j3Td2fWHru+4/NA+8M3BfbEEiJedK4qEQeGmgPtuaRaj/2vUm7D8J9/7Y56ktPg+eA1PD8MnWPGHu14EABH/KGUJpeUgCXcDB9tXWBwENYMgiWP/ZIQjM7KXEecri6gjCZCsb5AXXHkpVLuwjB3jxm2BNQiFH1gmSJPj7oKA6s0sCgKYUstqqShOhhW2uGm6g6zLsV2E0JoGpKXxla1YIWvES31WVaZB/snc6lACgSSxA830MuTUlbaG2CYbiXedKABBYMCXcRz7aoisiVAnq95iSin9/x9K+eDW6cALEKHV2moHkTAiosoxHs47UNT6cpmpBymVuXxg1kLUT6ANEvbYxJW1ey0IcHfLmxbaD1aSe2f6P8Mw1YLA61s+tFPskwOBGNbu2BXBEu/INYChL8eTXZrldE9AG9lsMq++tKxGbWpa6XK6W4Oyv4MGu5/rcbwRqCjT3RiPQh3wuCSegsc6zmhtHAm5NuqUPV7kW7jqnpZ0ccEl6gKb0oktruF+PseF6Y59jl1FNYg3RZBLHsdbFZddVSC3tBtLxYhqKBzhvHczKLuh4ObJPAj6qaHdWg1eNDIEVoZQTz+pinc9zyOecYdZCL0Jz5TtEfDrVkfpKrcmhtoZGB4Sgunhp1z5Y5YDLORP/lIyf0XfWw1yO4qYzkKLdPy9V0PBc3CzjIxvb8MKxUA8MwTC1h2eyhhJqw6XjxVlfAisDScklX3xhsVjwzNwWIVlC5s4fr0S5DnJsT/oSAJTP4gpaq0QTGfIrt8rxfCoPtGhcYaC+BAgVBrhYqBBUJ68UDUeqioIBINPllZQ+HR4XpmfVlwDAtgkAbV6ICUFk2UEk1hd7v/rhX0KgrfZrj2jyQh8ieIERGoPhPazPJ7IO3iz626g2khhQrTgHvZwhrPBI3EgpFJRp3kkCu9SGKvEAVtApMcba1wv+PHoh4X95S9ngTmiVEEAxlklNsBu7R7culZk9uLLVlOj38qyUQFseAFzHjRIieENDxo12r8qVEmjLA1421AvZpEsJdOXBGF7IIlFKoCsPuL+1RULvVIYQ6MoDgJdWpGzSQwi05QH/nKOSUN93KkMINOUBv13xDM2nbS4ajdQQAoBYBisDGOD0h73KUAJ7Bdv0siOBQ7vgP16Px5pAuTcUAAAAAElFTkSuQmCC",
			});

			return notification;
		},
	}
})();
YAAW.init();
