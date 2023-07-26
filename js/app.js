'use strict';

//数据（二元数组）对象
const Statistics = {
    count: 0, //变量对个数
    x_data: [], //自变量数组
    y_data: [], //因变量数组

    //数据相关信息的getter&setter
    //获取x最小值
    get _min_x() {
        return Math.min(...this.x_data);
    },

    //获取x最大值
    get _max_x() {
        return Math.max(...this.x_data);
    },

    //获取y最小值
    get _min_y() {
        return Math.min(...this.y_data);
    },

    //获取y最大值
    get _max_y() {
        return Math.max(...this.y_data);
    },

    //获取y元素的和
    //如果你遇到了问题，那么大概率你的变量数组中存在数字用字符串表示，（正确的是10，数组中是'10'）
    get _sum_y() {
        return this.y_data.reduce(function(a, b) {
            return a + b;
        }, 0);
    },
};
const colorbar = ['#8ECFC9', '#FFBE7A', '#FA7F6F', '#82B0D2', '#BEB8DC', '#E7DAD2', '#999999'];
const colorbar2 = ["#A1A9D0", "#F0988C", "#B883D4", "#9E9E9E", "#CFEAF1", "#C4A5DE", "#C4A5DE"];
//TODO: 添加标准配色方案
const standardSetmap = {
    barcolor: 1, //柱状图配色
    barpattern: 0, //柱状图填色方式
    linecolor: 1, //线颜色
    linewidth: 1, //线宽
    linepattern: 1, //线型
    dotcolor: 1, //点颜色
    dotwidth: 1, //点大小
    dotpattern: 0, //点形状
};



//图表类（需要支持ES6标准）
class Chart {
    //构造函数，主要用于展示变量、使用getter应对访问需求，实际赋值使用了setter
    constructor(canvas_id, canvas, context,
        x_axis_width, x_axis_color, x_axis_length_ratio, x_origin,
        y_axis_width, y_axis_color, y_axis_length_ratio, y_origin,
        arrow_width, arrow_height,
        x_scale_begin, x_scale_end, x_scale_step, x_scale_font, x_scale_color,
        y_scale_begin, y_scale_end, y_scale_step, y_scale_font, y_scale_color,
        x_label_string, x_label_font, x_label_color,
        y_label_string_1, y_label_string_2, y_label_font, y_label_color,
        bar_half_width,
        dot_height_ratio, dot_radius) {

        //画布
        this.canvas_id = canvas_id; //HTML中canvas的id
        this.canvas = canvas; //画布
        this.context = context; //绘图上下文

        //坐标轴
        this.x_axis_width = x_axis_width; //x轴线宽
        this.x_axis_color = x_axis_color; //x轴颜色
        this.x_axis_length_ratio = x_axis_length_ratio; //x轴相对长度
        this.x_origin = x_origin; //原点x值
        this.y_axis_width = y_axis_width; //y轴线宽
        this.y_axis_color = y_axis_color; //y轴颜色
        this.y_axis_length_ratio = y_axis_length_ratio; //y轴相对长度
        this.y_origin = y_origin; //原点y值，（之前把i拼错为o结果整个图表都没了...）
        this.arrow_width = arrow_width; //箭头单面宽度，（以平放的箭头-->为准，横向为宽，纵向为高）
        this.arrow_height = arrow_height; //箭头单面高度

        //刻度
        this.x_scale_begin = x_scale_begin; //x轴刻度最小值
        this.x_scale_end = x_scale_end; //x轴刻度最大值
        this.x_scale_step = x_scale_step; //x轴刻度跨度，（若值为3，则刻度为begin begin+3 begin+6...）
        this.x_scale_font = x_scale_font; //x轴刻度字体样式
        this.x_scale_color = x_scale_color; //x轴刻度颜色
        this.y_scale_begin = y_scale_begin; //y轴刻度最小值
        this.y_scale_end = y_scale_end; //y轴刻度最大值
        this.y_scale_step = y_scale_step; //y轴刻度跨度
        this.y_scale_font = y_scale_font; //y轴刻度字体样式
        this.y_scale_color = y_scale_color; //y轴刻度颜色

        //标签，标签内容存储可考虑改为string数组
        this.x_label_string = x_label_string; //x轴标签字符串
        this.x_label_font = x_label_font; //x轴标签字体样式
        this.x_label_color = x_label_color; //x轴标签颜色
        this.y_label_string_1 = y_label_string_1; //y轴标签字符串1
        this.y_label_string_2 = y_label_string_2; //y轴标签字符串2

        this.y_label_font = y_label_font; //y轴标签字体样式
        this.y_label_color = y_label_color; //y轴标签颜色

        //条形统计图
        this.bar_half_width = bar_half_width; //条的半宽度（！）
        //this.barcolor = barcolor; //条的颜色

        //折线统计图
        this.dot_height_ratio = dot_height_ratio; //点高度放大率（点在条上方，标示百分比，则高度增大相同倍数）
        this.dot_radius = dot_radius; //点半径

        //条形统计图和折线统计图的颜色、宽度、字号等样式暂时硬编码到对应函数里面了
        //可考虑添加:各类样式变量

        //柱状图颜色以及填色方案
        this.barcolor = 0;
        this.barflag = 0;
        //折线图线参数
        this.linecolor = 0;
        this.linepattern = 0;
        this.linewidth = 0;
        //折线图点参数
        this.dotcolor = 0;
        this.dotwidth = 0;
        this.dotpattern = 0;

    }

    //准备绘图工具
    initContext(canvas_id, linecanvas_id, dotcanvas_id, barcanvas_id) {
        /*
        为方便管理，此处改进了画布管理；
        canvas：原始画布，包含坐标轴以及坐标轴标签
        linecanvas: 折线图线画布，包含折线图的折现元素
        dotcanvas：折线图点画布，包含折线图的点元素以及百分比标签
        barcanvas：柱状图画布，包含柱状图矩形以及数量标签
        */
        //初始化绘图上下文，坐标轴画布
        this.canvas = document.getElementById(canvas_id);
        this.context = this.canvas.getContext('2d');
        //线画布
        this.linecanvas = document.getElementById(linecanvas_id);
        this.linecontext = this.linecanvas.getContext('2d');
        //点画布
        this.dotcanvas = document.getElementById(dotcanvas_id);
        this.dotcontext = this.dotcanvas.getContext('2d');
        //柱状图画布
        this.barcanvas = document.getElementById(barcanvas_id);
        this.barcontext = this.barcanvas.getContext('2d');

        /*坐标轴（此处指canvas坐标轴）变换为原点在左下角，y轴竖直向上
         **画图更加方便直观
         **文字、图像（不过chart内部应该不用画图）会上下颠倒
         **此时可考虑用drawText(context, text, x, y)函数，定义见下
         */
        /*以下提供逆变换作参考：
        context.scale(1, -1);
        context.translate(0, -canvas.height);
        */
        this.context.translate(0, this.canvas.height);
        this.context.scale(1, -1);
        this.linecontext.translate(0, this.linecanvas.height);
        this.linecontext.scale(1, -1);
        this.dotcontext.translate(0, this.dotcanvas.height);
        this.dotcontext.scale(1, -1);
        this.barcontext.translate(0, this.barcanvas.height);
        this.barcontext.scale(1, -1);

    }

    //绘制文字（坐标轴变换后，若使用变换后的坐标轴，建议使用该函数绘制文字，避免上下颠倒，文字属性可在函数外的context中修改）
    drawText(context, text, x, y) {
        context.scale(1, -1);
        context.fillText(text, x, -y);
        context.scale(1, -1);
    }

    //重设坐标刻度值
    resetScale() {
        // 横坐标刻度值
        this.x_scale_begin = Statistics._min_x;
        this.x_scale_end = Statistics._max_x;
        this.x_scale_step = 1;
        this.bar_half_width = 20;
        // 当数据点过于密集时，适当缩小条的宽度比例，使用幂函数进行缩小图形较为美观
        if (this.x_scale_end - this.x_scale_begin > 7) {
            let surplus = this.x_scale_end - this.x_scale_begin - 7;
            let decline_rate = 0.96;
            this.bar_half_width = this.bar_half_width * Math.pow(decline_rate, surplus);
        }

        // 纵坐标刻度值
        //策略一：最大值不超过7，令step=1更美观
        if (Statistics._max_y <= 7) {
            this.y_scale_begin = 1;
            // 最大值4以下最大值就为4
            this.y_scale_end = Statistics._max_y <= 4 ? 4 : Statistics._max_y + 1;
            this.y_scale_step = 1;
        }
        //策略二：最大值超过7
        else {
            // 定义一个最大值与最小值的比例值，根据这个比例值选择不同的策略
            let flag = (Statistics._max_y - Statistics._min_y) / Statistics._min_y;
            // 差异悬殊，要防止最大值处折线图超出canva范围
            if (flag > 2) {
                this.y_scale_begin = Math.floor(Statistics._min_y);
                this.y_scale_end = Math.ceil(Statistics._max_y * 1.2);
            }
            // 差异较小，如果不处理可能会出现较为左右差异极端的图像
            else {
                this.y_scale_begin = Math.floor(Statistics._min_y * 0.9);
                this.y_scale_end = Math.ceil(Statistics._max_y * 1.1);
            }
            // 强迫数据点为6个，按6个重设step值
            let difference = this.y_scale_end - this.y_scale_begin;
            let point_number = 6;
            this.y_scale_step = Math.ceil(difference / point_number);
        }
    }


    //获取数据点对应绘图坐标（此处指canvas坐标，但原点从图表原点开始，准确的canvas坐标需加上图表原点坐标）
    /*点位置分量（条形统计图中条形x值以底部中心为参考）是变量值的一次函数
     **pos_x = Ax + B     pos_y = Ay + B
     **由(begin,distance)，(end,length-distance)两点可确定A、B值
     **A、B与输入数据无直接关系，依赖于坐标轴长度与刻度范围（可优化为只求一次值）
     */
    getCoordinate(canvas, x_data, y_data) {
        //获取x坐标
        let x_length = this.x_axis_length_ratio * canvas.width;
        let x_scale_array = [];
        for (let i = this.x_scale_begin; i <= this.x_scale_end; i += this.x_scale_step) {
            x_scale_array.push(i);
        }
        let x_distance = this.x_axis_length_ratio * canvas.width / (x_scale_array.length + 1);
        let x_A = (x_length - 2 * x_distance) / (this.x_scale_end - this.x_scale_begin);
        let x_B = (x_distance * (this.x_scale_end + this.x_scale_begin) - x_length * this.x_scale_begin) / (this.x_scale_end - this.x_scale_begin);
        let x_pos = x_A * x_data + x_B;

        //获取y坐标
        let y_length = this.y_axis_length_ratio * canvas.height;
        let y_scale_array = [];
        for (let i = this.y_scale_begin; i <= this.y_scale_end; i += this.y_scale_step) {
            y_scale_array.push(i);
        }
        let y_distance = this.y_axis_length_ratio * canvas.height / (y_scale_array.length + 1);
        let y_A = (y_length - 2 * y_distance) / (this.y_scale_end - this.y_scale_begin);
        let y_B = (y_distance * (this.y_scale_end + this.y_scale_begin) - y_length * this.y_scale_begin) / (this.y_scale_end - this.y_scale_begin);
        let y_pos = y_A * y_data + y_B;

        return {
            x_pos,
            y_pos,
        };
    }

    //清除画布上的所有内容
    clearCanvas(canvas, context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
    }

    //绘制坐标轴
    drawAxis(canvas, context) {
        //绘制x轴
        context.lineWidth = this.x_axis_width;
        context.strokeStyle = this.x_axis_color;
        context.beginPath();
        context.moveTo(this.x_origin, this.y_origin);
        context.lineTo(this.x_origin + this.x_axis_length_ratio * canvas.width, this.y_origin);
        context.lineTo(this.x_origin + this.x_axis_length_ratio * canvas.width - this.arrow_width, this.y_origin + this.arrow_height);
        context.moveTo(this.x_origin + this.x_axis_length_ratio * canvas.width, this.y_origin);
        context.lineTo(this.x_origin + this.x_axis_length_ratio * canvas.width - this.arrow_width, this.y_origin - this.arrow_height);
        context.stroke();

        //绘制y轴
        context.lineWidth = this.y_axis_width;
        context.strokeStyle = this.y_axis_color;
        context.beginPath();
        context.moveTo(this.x_origin, this.y_origin);
        context.lineTo(this.x_origin, this.y_origin + this.y_axis_length_ratio * canvas.height);
        context.lineTo(this.x_origin + this.arrow_height, this.y_origin + this.y_axis_length_ratio * canvas.height - this.arrow_width);
        context.moveTo(this.x_origin, this.y_origin + this.y_axis_length_ratio * canvas.height);
        context.lineTo(this.x_origin - this.arrow_height, this.y_origin + this.y_axis_length_ratio * canvas.height - this.arrow_width);
        context.stroke();
    }

    //绘制刻度
    drawScale(canvas, context) {
        //绘制x轴刻度
        context.font = this.x_scale_font;
        context.fillStyle = this.x_scale_color;
        context.textAlign = 'center';
        let x_scale_array = [];
        for (let i = this.x_scale_begin; i <= this.x_scale_end; i += this.x_scale_step) {
            x_scale_array.push(i);
        }
        let x_distance = this.x_axis_length_ratio * canvas.width / (x_scale_array.length + 1);
        for (let i = 0; i < x_scale_array.length; i++) {
            this.drawText(context, x_scale_array[i].toString(), this.x_origin + (i + 1) * x_distance, this.y_origin - parseInt(this.x_scale_font));
        }

        //绘制y轴刻度
        context.font = this.y_scale_font;
        context.fillStyle = this.y_scale_color;
        context.textBaseline = 'middle';
        let y_scale_array = [];
        for (let i = this.y_scale_begin; i <= this.y_scale_end; i += this.y_scale_step) {
            y_scale_array.push(i);
        }
        let y_distance = this.y_axis_length_ratio * canvas.height / (y_scale_array.length + 1);
        for (let i = 0; i < y_scale_array.length; i++) {
            this.drawText(context, y_scale_array[i].toString(), this.x_origin - parseInt(this.y_scale_font), this.y_origin + (i + 1) * y_distance);;
        }
    }

    //绘制标签
    //parseInt(font)用于获取字号，需要font的第一个样式为字号，单位为px，（如font = '12px Arial'）
    drawLabel(canvas, context) {
        //绘制x轴标签
        context.font = this.x_label_font;
        context.fillStyle = this.x_label_color;
        this.drawText(context, this.x_label_string, this.x_origin + this.x_axis_length_ratio * canvas.width + 1.5 * parseInt(this.x_label_font), this.y_origin);

        //绘制y轴标签
        context.font = this.y_label_font;
        context.fillStyle = this.y_label_color;
        this.drawText(context, this.y_label_string_1, this.x_origin, this.y_origin + this.y_axis_length_ratio * canvas.height + 2 * parseInt(this.y_label_font));
        this.drawText(context, this.y_label_string_2, this.x_origin, this.y_origin + this.y_axis_length_ratio * canvas.height + parseInt(this.y_label_font));
    }

    //绘制条形图
    drawBarGraph(canvas, context, barcanvas, barcontext) {
        //获取坐标值
        let coordinates = [];
        for (let i = 0; i < Statistics.count; i++) {
            coordinates.push(this.getCoordinate(canvas, Statistics.x_data[i], Statistics.y_data[i]));
        }
        //绘制矩形及标签
        for (let i = 0; i < Statistics.count; i++) {
            barcontext.fillStyle = this.barcolor;
            barcontext.fillRect(this.x_origin + coordinates[i].x_pos - this.bar_half_width, this.y_origin, 2 * this.bar_half_width, coordinates[i].y_pos);
            barcontext.fillStyle = 'black';
            this.drawText(barcontext, Statistics.y_data[i].toString(), this.x_origin + coordinates[i].x_pos, this.y_origin + coordinates[i].y_pos + 8);
        }
        //其他设置和改进就交给后面各位了~
        this.barflag = 0;
    }

    //绘制折线图
    drawBrokenLineGraph(canvas, context, linecanvas, linecontext, dotcanvas, dotcontext) {
        //获取坐标值
        let coordinates = [];
        for (let i = 0; i < Statistics.count; i++) {
            coordinates.push(this.getCoordinate(canvas, Statistics.x_data[i], Statistics.y_data[i]));
        }
        //绘制折线
        for (let i = 0; i < Statistics.count - 1; i++) {
            linecontext.beginPath();
            linecontext.moveTo(this.x_origin + coordinates[i].x_pos, this.y_origin + this.dot_height_ratio * coordinates[i].y_pos);
            linecontext.lineTo(this.x_origin + coordinates[i + 1].x_pos, this.y_origin + this.dot_height_ratio * coordinates[i + 1].y_pos);
            linecontext.strokeStyle = 'black';
            linecontext.width = 1;
            linecontext.stroke();
        }
        //绘制数据点及标签
        let sum_y = Statistics._sum_y;
        linecontext.font = "12px Arial";
        for (let i = 0; i < Statistics.count; i++) {
            dotcontext.beginPath();
            dotcontext.arc(this.x_origin + coordinates[i].x_pos, this.y_origin + this.dot_height_ratio * coordinates[i].y_pos, this.dot_radius, 0, 2 * Math.PI, true);
            dotcontext.closePath();
            dotcontext.fillStyle = 'black';
            dotcontext.fill();

            dotcontext.strokeStyle = 'black';
            dotcontext.lineWidth = 1;
            dotcontext.stroke();
            let percent = (100 * Statistics.y_data[i] / sum_y).toFixed(0) + '%';
            dotcontext.fillStyle = 'black';
            this.drawText(dotcontext, percent, this.x_origin + coordinates[i].x_pos, this.y_origin + this.dot_height_ratio * coordinates[i].y_pos + 12);
        }

        this.linecolor = 'black';
        this.linepattern = 0;
        this.linewidth = 50;
        this.dotcolor = 'black';
        this.dotpattern = 0;
        this.dotwidth = 50;

        this.fillflag = 0;
    }

    //绘制图表，使一切画布内容重画
    /*
     *仅初次绘制时调用，重新绘制时建议使用updateChart(chart)函数（重绘函数不在类内）
     */
    drawChart() {
        //取得绘图上下文
        let canvas = this.canvas;
        let context = this.context;
        let linecanvas = this.linecanvas;
        let linecontext = this.linecontext;
        let dotcanvas = this.dotcanvas;
        let dotcontext = this.dotcontext;

        let barcanvas = this.barcanvas;
        let barcontext = this.barcontext;


        //清除当前绘制的内容
        this.clearCanvas(canvas, context);

        //调用函数绘制
        this.drawAxis(canvas, context);
        this.drawScale(canvas, context);
        this.drawLabel(canvas, context);
        this.drawBarGraph(canvas, context, barcanvas, barcontext);
        this.drawBrokenLineGraph(canvas, context, linecanvas, linecontext, dotcanvas, dotcontext);
    }

}
class colorSet {
    constructor(colorbar, colorbar2) {
        this.colorbar = colorbar;
        this.colorbar2 = colorbar2;
    }
    drawset(colorbar, id) {
        var canvas = document.getElementById(id);
        var ctx = canvas.getContext("2d");

        // 定义七种颜色和它们的起始和结束位置
        const colors1 = [
            { color: colorbar[0], start: 0, end: 1 },
            { color: colorbar[1], start: 1, end: 2 },
            { color: colorbar[2], start: 2, end: 3 },
            { color: colorbar[3], start: 3, end: 4 },
            { color: colorbar[4], start: 4, end: 5 },
            { color: colorbar[5], start: 5, end: 6 },
            { color: colorbar[6], start: 6, end: 7 },
        ];

        // 创建线性渐变对象
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);

        // 添加颜色断点到渐变对象
        for (const item of colors1) {
            gradient.addColorStop(item.start / 7, item.color);
            gradient.addColorStop(item.end / 7, item.color);
        }

        // 使用渐变对象作为填充样式绘制矩形
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

}
//表格类，不实际存储表格，仅提供对页面内表格的操作
class Table {
    //构造函数
    constructor(table_lines_count, table_container_id, table_id) {
        this.table_lines_count = table_lines_count; //表格行数
        this.table_container_id = table_container_id; //HTML中表格容器的id
        this.table_id = table_id; //HTML中表格的id
    }

    //添加表格行
    addRow(row_num) {
        let table = document.getElementById(this.table_id);
        this.table_lines_count += row_num;
        for (let i = 0; i < row_num; i++) {
            let row = table.insertRow(-1);
            let cell1 = row.insertCell(0);
            cell1.contentEditable = 'true';
            cell1.setAttribute('style', 'width: 100px; height: 20px; border: 1px solid black; padding: 8px; text-align: center;');
            let cell2 = row.insertCell(1);
            cell2.contentEditable = 'true';
            cell2.setAttribute('style', 'width: 100px; height: 20px; border: 1px solid black; padding: 8px; text-align: center;');
        }
    }

    //向表格添加数据，由于表头占一行，数据的行序号即为row的值，（即从1开始）
    addData(row, x, y) {
        let table = document.getElementById(this.table_id);
        if (this.table_lines_count < row) {
            this.addRow(row - this.table_lines_count);
        }
        let rows = table.getElementsByTagName('tr');
        rows[row].cells[0].innerText = x;
        rows[row].cells[1].innerText = y;
    }

    //清除表格内容
    clearTable() {
        let table = document.getElementById(this.table_id);
        let cells = table.getElementsByTagName("td");
        for (let i = 0; i < cells.length; i++) {
            cells[i].innerHTML = "";
        }
    }

} //动态化、按钮等相关函数在后面

/**
 * 变量初始化区域
 * 当前初始化内容：
 * Statistics对象
 * Chart类对象
 * Table类对象
 * *****开始*****
 */

//初始化Statistics对象
Statistics.count = 4;
Statistics.x_data = [2019, 2020, 2021, 2022];
Statistics.y_data = [2, 3, 5, 4];

//实例化Chart对象
var chart = new Chart;
var colorset = new colorSet(colorbar, colorbar2);

//使用setter设置变量值
//画布id
chart.canvas_id = 'chart-canvas';
chart.linecanvas_id = 'line-canvas';
chart.dotcanvas_id = 'dot-canvas';
chart.barcanvas_id = 'bar-canvas';
//坐标轴
chart.x_axis_width = 2;
chart.x_axis_color = 'black';
chart.x_axis_length_ratio = 0.85;
chart.x_origin = 30;
chart.y_axis_width = 2;
chart.y_axis_color = 'black';
chart.y_axis_length_ratio = 0.8;
chart.y_origin = 30;
chart.arrow_width = 5;
chart.arrow_height = 5;

//刻度
chart.x_scale_begin = 2019;
chart.x_scale_end = 2022;
chart.x_scale_step = 1;
chart.x_scale_font = '12px Arial';
chart.x_scale_color = 'black';
chart.y_scale_begin = 1;
chart.y_scale_end = 6;
chart.y_scale_step = 1;
chart.y_scale_font = '12px Arial';
chart.y_scale_color = 'black';

//标签
chart.x_label_string = '年份';
chart.x_label_font = '14px Arial';
chart.x_label_color = 'black';
chart.y_label_string_1 = '产量';
chart.y_label_string_2 = '(万吨)';
chart.y_label_font = '14px Arial';
chart.y_label_color = 'black';

//条形统计图
chart.bar_half_width = 20;
chart.barcolor = 'black';

//折线统计图
chart.dot_height_ratio = 1.3;
chart.dot_radius = 4;

//实例化表格对象
var table = new Table;

//初始化表格参数
table.table_lines_count = 4;
table.table_container_class = 'table-container';
table.table_id = 'data-table';


/**
 * 变量初始化区域
 * *****结束*****
 */

/**
 * 函数运行部分
 * *****开始*****
 */

//绘制图表
chart.initContext(chart.canvas_id, chart.linecanvas_id, chart.dotcanvas_id, chart.barcanvas_id);
chart.drawChart();
colorset.drawset(colorbar, "colorCard");
colorset.drawset(colorbar2, "colorCard2");
//初始化表格
initDynamicTable();


/**
 * 函数运行部分
 * *****结束*****
 */

//柱状图颜色变化监听
function watchColorPicker(event) {
    //console.log(colorPicker.value);
    chart.barcolor = colorPicker.value;
    updateBarGraph(chart.canvas, chart.context, chart.barcanvas, chart.barcontext, colorPicker.value, chart.barflag);
    updateBarShape(chart.canvas, chart.context, chart.barcanvas, chart.barcontext, chart.barcolor, chart.fillflag);

}
//折线图线颜色变化监听
function watchlineColorPicker(event) {
    //console.log(colorPicker_2.value);
    var color = colorPicker2.value;
    chart.linecolor = color;
    updateBrokenLineGraph(chart.canvas, chart.context, chart.linecanvas, chart.linecontext, color, chart.linepattern, chart.linewidth);
}
//折线图线宽度变化监听
function watchsliderchange(event) {
    //console.log(slider.value);
    var width = slider.value;
    chart.linewidth = width;

    updateBrokenLineGraph(chart.canvas, chart.context, chart.linecanvas, chart.linecontext, chart.linecolor, chart.linepattern, width);
}
//折线图点颜色变化监听
function watchdotColorPicker(event) {
    //console.log(colorPicker_3.value);
    var color = colorPicker3.value;
    chart.dotcolor = color;
    updateBrokenDotGraph(chart.canvas, chart.context, chart.dotcanvas, chart.dotcontext, color, 0, 0);
}
//折线图点大小变化监听
function watchdotsliderchange(event) {
    //console.log(slider_2.value);
    var width = slider2.value;
    chart.dotwidth = width;
    updateBrokenDotGraph(chart.canvas, chart.context, chart.dotcanvas, chart.dotcontext, 0, 0, width);
}
//柱状图显示情况监听
function watchbarcheck(event) {
    //console.log(barcheck.checked);
    if (barcheck.checked) {
        updateBarGraph(chart.canvas, chart.context, chart.barcanvas, chart.barcontext, chart.barcolor, chart.barflag);
        updateBarShape(chart.canvas, chart.context, chart.barcanvas, chart.barcontext, chart.barcolor, chart.fillflag);
    } else {
        chart.barcontext.clearRect(0, 0, chart.barcanvas.width, chart.barcanvas.height);
    }
}
//折线图显示情况监听
function watchlinecheck(event) {
    //console.log(linecheck.checked);
    if (linecheck.checked) {
        updateBrokenDotGraph(chart.canvas, chart.context, chart.dotcanvas, chart.dotcontext, chart.dotcolor, chart.dotpattern, chart.dotwidth);
        updateBrokenLineGraph(chart.canvas, chart.context, chart.linecanvas, chart.linecontext, chart.linecolor, chart.linepattern, chart.linewidth);
    } else {
        chart.linecontext.clearRect(0, 0, chart.linecanvas.width, chart.linecanvas.height);
        chart.dotcontext.clearRect(0, 0, chart.linecanvas.width, chart.linecanvas.height);
    }
}

function watchcolorcheck1(event) {
    if (colorcheck1.checked) {
        chart.barcolor = 1;
        chart.dotcolor = colorbar[6];
        chart.linecolor = "#999990";
        updateBarGraph(chart.canvas, chart.context, chart.barcanvas, chart.barcontext, 1, chart.barflag);
        updateBarShape(chart.canvas, chart.context, chart.barcanvas, chart.barcontext, 1, chart.fillflag);
        updateBrokenDotGraph(chart.canvas, chart.context, chart.dotcanvas, chart.dotcontext, chart.dotcolor, chart.dotpattern, chart.dotwidth);
        updateBrokenLineGraph(chart.canvas, chart.context, chart.linecanvas, chart.linecontext, chart.linecolor, chart.linepattern, chart.linewidth);

    } else {
        if (colorcheck2.checked) {
            chart.barcolor = 2;
            chart.dotcolor = colorbar[6];
            chart.linecolor = "#999990";
            updateBarGraph(chart.canvas, chart.context, chart.barcanvas, chart.barcontext, 2, chart.barflag);
            updateBarShape(chart.canvas, chart.context, chart.barcanvas, chart.barcontext, 2, chart.fillflag);
            updateBrokenDotGraph(chart.canvas, chart.context, chart.dotcanvas, chart.dotcontext, chart.dotcolor, chart.dotpattern, chart.dotwidth);
            updateBrokenLineGraph(chart.canvas, chart.context, chart.linecanvas, chart.linecontext, chart.linecolor, chart.linepattern, chart.linewidth);
        } else {
            getSelectedValue();
            getshapeSelectedValue();
            getdotSelectedValue();
            getlineSelectedValue();
            watchColorPicker();
            watchlineColorPicker();
            watchsliderchange();
            watchdotColorPicker();
            watchdotsliderchange();
        }

    }

}

function watchcolorcheck2(event) {
    console.log("change2");
    if (colorcheck2.checked) {
        chart.barcolor = 2;
        chart.dotcolor = colorbar[6];
        chart.linecolor = "#999990";
        updateBarGraph(chart.canvas, chart.context, chart.barcanvas, chart.barcontext, 2, chart.barflag);
        updateBarShape(chart.canvas, chart.context, chart.barcanvas, chart.barcontext, 2, chart.fillflag);
        updateBrokenDotGraph(chart.canvas, chart.context, chart.dotcanvas, chart.dotcontext, chart.dotcolor, chart.dotpattern, chart.dotwidth);
        updateBrokenLineGraph(chart.canvas, chart.context, chart.linecanvas, chart.linecontext, chart.linecolor, chart.linepattern, chart.linewidth);

    } else {
        if (colorcheck1.checked) {
            chart.barcolor = 1;
            chart.dotcolor = colorbar[6];
            chart.linecolor = "#999990";
            updateBarGraph(chart.canvas, chart.context, chart.barcanvas, chart.barcontext, 1, chart.barflag);
            updateBarShape(chart.canvas, chart.context, chart.barcanvas, chart.barcontext, 1, chart.fillflag);
            updateBrokenDotGraph(chart.canvas, chart.context, chart.dotcanvas, chart.dotcontext, chart.dotcolor, chart.dotpattern, chart.dotwidth);
            updateBrokenLineGraph(chart.canvas, chart.context, chart.linecanvas, chart.linecontext, chart.linecolor, chart.linepattern, chart.linewidth);
        } else {
            getSelectedValue();
            getshapeSelectedValue();
            getdotSelectedValue();
            getlineSelectedValue();
            watchColorPicker();
            watchlineColorPicker();
            watchsliderchange();
            watchdotColorPicker();
            watchdotsliderchange();
        }

    }

}
//柱状图填充颜色方案监听
function getSelectedValue() {
    var selectElement = document.getElementById("mySelect");
    //console.log(selectElement);
    var selectedValue = selectElement.value;
    //console.log(selectedValue);
    var barcolor = colorPicker.value;
    var flag = 0;
    if (selectedValue == "option1") {
        flag = 1;
    } else if (selectedValue == "option2") {
        flag = 2;
    } else if (selectedValue == "option3") {
        flag = 3;
    } else if (selectedValue == "option0") {
        flag = 0;
    } else if (selectedValue == "option4") {
        flag = 4;
    }
    chart.barcolor = barcolor;
    chart.barflag = flag;
    updateBarShape(chart.canvas, chart.context, chart.barcanvas, chart.barcontext, chart.barcolor, chart.fillflag);
    //updateBarGraph(chart.canvas, chart.context, chart.barcanvas, chart.barcontext, barcolor, flag);
    return barcolor;
}

//柱状图填充形状方案监听
function getshapeSelectedValue() {
    var selectElement = document.getElementById("myshapeSelect");
    console.log(selectElement);
    var selectedValue = selectElement.value;
    console.log(selectedValue);
    var barcolor = colorPicker.value;
    var flag = 0;
    if (selectedValue == "option0") {
        flag = 0;
    } else if (selectedValue == "option1") {
        flag = 1;
    } else if (selectedValue == "option2") {
        flag = 2;
    } else if (selectedValue == "option3") {
        flag = 3;
    }
    chart.barcolor = barcolor;
    updateBarShape(chart.canvas, chart.context, chart.barcanvas, chart.barcontext, chart.barcolor, flag);
    return barcolor;
}
//折线图点形状变化监听
function getdotSelectedValue() {
    var selectElement = document.getElementById("mydotSelect");
    //console.log(selectElement);
    var selectedValue = selectElement.value;

    var pattern = 0;
    if (selectedValue == "option0") {
        pattern = 0;
    } else if (selectedValue == "option1") {
        pattern = 1;
    } else if (selectedValue == "option2") {
        pattern = 2;
    }
    chart.dotpattern = pattern;
    updateBrokenDotGraph(chart.canvas, chart.context, chart.dotcanvas, chart.dotcontext, 0, pattern, 0);
}
//折线图线型变化监听
function getlineSelectedValue() {
    var selectElement = document.getElementById("mylineSelect");
    //console.log(selectElement);
    var selectedValue = selectElement.value;
    //console.log(selectedValue);
    var line_width = slider.value;
    var pattern = 0;
    if (selectedValue == "option1") {
        pattern = [1, 10];
    } else if (selectedValue == "option2") {
        pattern = [3, 10];
    } else if (selectedValue == "option3") {
        pattern = [5, 10];
    } else if (selectedValue == "option0") {
        pattern = 0;
    } else if (selectedValue == "option4") {
        pattern = [7, 10];
    }
    chart.linepattern = pattern;
    updateBrokenLineGraph(chart.canvas, chart.context, chart.linecanvas, chart.linecontext, chart.linecolor, pattern, chart.linewidth);
}

function updateBarShape(canvas, context, barcanvas, barcontext, color, flag) {
    console.log(barcheck.checked);
    if (!barcheck.checked) { barcontext.clearRect(0, 0, barcanvas.width, barcanvas.height); return; }
    let coordinates = [];
    for (let i = 0; i < Statistics.count; i++) {
        coordinates.push(chart.getCoordinate(canvas, Statistics.x_data[i], Statistics.y_data[i]));
    }
    chart.fillflag = flag;
    if (flag == 0) {
        barcontext.clearRect(0, 0, barcanvas.width, barcanvas.height);
        updateBarGraph(chart.canvas, chart.context, chart.barcanvas, chart.barcontext, chart.barcolor, chart.barflag);
    } else if (flag == 1) {
        barcontext.clearRect(0, 0, barcanvas.width, barcanvas.height);
        updateBarGraph(chart.canvas, chart.context, chart.barcanvas, chart.barcontext, chart.barcolor, chart.barflag);

        for (let i = 0; i < Statistics.count; i++) {
            for (let j = 0; j <= coordinates[i].y_pos - 5;) {
                barcontext.beginPath();
                barcontext.moveTo(chart.x_origin + coordinates[i].x_pos - chart.bar_half_width, chart.y_origin + j);
                j = j + 5;
                barcontext.lineTo(chart.x_origin + coordinates[i].x_pos + chart.bar_half_width, chart.y_origin + j);
                barcontext.strokeStyle = "white"; //chage color according to ...
                barcontext.stroke();
            }
        }
    } else if (flag == 2) {
        barcontext.clearRect(0, 0, barcanvas.width, barcanvas.height);
        updateBarGraph(chart.canvas, chart.context, chart.barcanvas, chart.barcontext, chart.barcolor, chart.barflag);
        for (let i = 0; i < Statistics.count; i++) {
            for (let j = 0; j <= coordinates[i].y_pos - 5;) {
                barcontext.beginPath();
                barcontext.moveTo(chart.x_origin + coordinates[i].x_pos + chart.bar_half_width, chart.y_origin + j);
                j = j + 5;
                barcontext.lineTo(chart.x_origin + coordinates[i].x_pos - chart.bar_half_width, chart.y_origin + j);
                barcontext.strokeStyle = "white"; //chage color according to ...
                barcontext.stroke();
            }
        }
    } else if (flag == 3) {
        barcontext.clearRect(0, 0, barcanvas.width, barcanvas.height);
        updateBarGraph(chart.canvas, chart.context, chart.barcanvas, chart.barcontext, chart.barcolor, chart.barflag);
        var filldot_radius = 2 * chart.bar_half_width / 10;
        for (let i = 0; i < Statistics.count; i++) {
            for (let j = filldot_radius; j <= coordinates[i].y_pos - 1 * filldot_radius;) {
                for (let k = filldot_radius; k <= 2 * chart.bar_half_width - filldot_radius;) {
                    barcontext.beginPath();
                    var x = chart.x_origin + coordinates[i].x_pos - chart.bar_half_width + k;
                    var y = chart.y_origin + j;
                    ///console.log("xy", x, y)
                    barcontext.arc(x, y, filldot_radius, 0, 2 * Math.PI, true);
                    barcontext.closePath();
                    barcontext.fillStyle = "white"; //todo color
                    barcontext.fill();
                    k = k + 2 * filldot_radius + 2;
                }
                j = j + 2 * filldot_radius + 2;
            }
        }
    }
}

//柱状图重绘更新
function updateBarGraph(canvas, context, barcanvas, barcontext, color, flag) {
    //console.log(barcheck.checked);
    if (!barcheck.checked) { barcontext.clearRect(0, 0, barcanvas.width, barcanvas.height); return; }
    barcontext.clearRect(0, 0, barcanvas.width, barcanvas.height);
    let coordinates = [];
    for (let i = 0; i < Statistics.count; i++) {
        coordinates.push(chart.getCoordinate(canvas, Statistics.x_data[i], Statistics.y_data[i]));
    }
    var tempcolor;
    if (flag == 0) {
        for (let i = 0; i < Statistics.count; i++) {
            if (color == 1) {
                barcontext.fillStyle = colorbar[i % 7];
            } else if (color == 2) {
                barcontext.fillStyle = colorbar2[i % 7];
            } else {
                barcontext.fillStyle = color;
            }
            console.log("fillstyle", barcontext.fillStyle);
            barcontext.fillRect(chart.x_origin + coordinates[i].x_pos - chart.bar_half_width, chart.y_origin, 2 * chart.bar_half_width, coordinates[i].y_pos);
            barcontext.fillStyle = 'black';
            chart.drawText(barcontext, Statistics.y_data[i].toString(), chart.x_origin + coordinates[i].x_pos, chart.y_origin + coordinates[i].y_pos + 8);

        }
    } else {
        for (let i = 0; i < Statistics.count; i++) {
            if (flag == 1 || flag == 2) {
                var gradient = chart.barcontext.createLinearGradient(chart.x_origin + coordinates[i].x_pos - chart.bar_half_width, chart.y_origin, chart.x_origin + coordinates[i].x_pos - chart.bar_half_width, chart.y_origin + coordinates[i].y_pos);

            } else if (flag == 3 || flag == 4) {
                var gradient = chart.barcontext.createLinearGradient(chart.x_origin + coordinates[0].x_pos - chart.bar_half_width, chart.y_origin, chart.x_origin + coordinates[Statistics.count - 1].x_pos + chart.bar_half_width, chart.y_origin + coordinates[Statistics.count - 1].y_pos);

            }
            if (color == 1) {
                var tempcolor = colorbar[i % 7];

            } else if (color == 2) {
                var tempcolor = colorbar2[i % 7];
            } else {
                var tempcolor = color;
            }
            if (flag == 2 || flag == 4) {
                gradient.addColorStop(0, tempcolor);
                gradient.addColorStop(1, "white");
            } else if (flag == 1 || flag == 3) {
                gradient.addColorStop(1, tempcolor);
                gradient.addColorStop(0, "white");

            }
            barcontext.fillStyle = gradient;
            barcontext.fillRect(chart.x_origin + coordinates[i].x_pos - chart.bar_half_width, chart.y_origin, 2 * chart.bar_half_width, coordinates[i].y_pos);
            console.log(chart.x_origin + coordinates[i].x_pos - chart.bar_half_width, chart.y_origin, 2 * chart.bar_half_width, coordinates[i].y_pos);
            console.log(coordinates[i].y_pos);

            barcontext.fillStyle = 'black';
            chart.drawText(barcontext, Statistics.y_data[i].toString(), chart.x_origin + coordinates[i].x_pos, chart.y_origin + coordinates[i].y_pos + 8);

        }
    }
}

//折线图线重绘更新
function updateBrokenLineGraph(canvas, context, linecanvas, linecontext, color, pattern, width) {
    //获取坐标值
    let coordinates = [];
    for (let i = 0; i < Statistics.count; i++) {
        coordinates.push(chart.getCoordinate(canvas, Statistics.x_data[i], Statistics.y_data[i]));
    }
    linecontext.clearRect(0, 0, linecanvas.width, linecanvas.height);
    if (!linecheck.checked) {
        return;
    }
    for (let i = 0; i < Statistics.count - 1; i++) {
        linecontext.beginPath();
        linecontext.moveTo(chart.x_origin + coordinates[i].x_pos, chart.y_origin + chart.dot_height_ratio * coordinates[i].y_pos);
        linecontext.lineTo(chart.x_origin + coordinates[i + 1].x_pos, chart.y_origin + chart.dot_height_ratio * coordinates[i + 1].y_pos);
        linecontext.strokeStyle = color;
        linecontext.lineWidth = width / 16;

        if (pattern != 0) {
            linecontext.setLineDash(pattern);
            linecontext.lineDashOffset = 10;
            linecontext.stroke();
        } else if (pattern == 0) {
            linecontext.setLineDash([]);
            linecontext.stroke();
        }

    }
    //绘制折线
}

//折线图点重绘更新
function updateBrokenDotGraph(canvas, context, dotcanvas, dotcontext, color, pattern, width) {
    let coordinates = [];
    for (let i = 0; i < Statistics.count; i++) {
        coordinates.push(chart.getCoordinate(canvas, Statistics.x_data[i], Statistics.y_data[i]));
    }
    //绘制数据点及标签
    let sum_y = Statistics._sum_y;
    //console.log(color);
    dotcontext.clearRect(0, 0, dotcanvas.width, dotcanvas.height);
    if (width != 0) {
        chart.dotwidth = width;
    } else if (color != 0) {
        chart.dotcolor = color;
    } else if (chart.dotpattern != pattern) {
        chart.dotpattern = pattern;
    }
    color = chart.dotcolor;
    pattern = chart.dotpattern;
    width = chart.dotwidth;
    if (!linecheck.checked) {
        return;
    }

    if (pattern == 0) {

        for (let i = 0; i < Statistics.count; i++) {
            dotcontext.beginPath();
            dotcontext.arc(chart.x_origin + coordinates[i].x_pos, chart.y_origin + chart.dot_height_ratio * coordinates[i].y_pos, chart.dot_radius * width / 30, 0, 2 * Math.PI, true);
            dotcontext.closePath();
            dotcontext.fillStyle = color;
            dotcontext.fill();
            dotcontext.strokeStyle = color;
            dotcontext.lineWidth = 1;
            dotcontext.stroke();
        }
    } else if (pattern == 1) {
        for (let i = 0; i < Statistics.count; i++) {
            dotcontext.beginPath();
            var edge = chart.dot_radius * width / 30;
            var x_dot = chart.x_origin + coordinates[i].x_pos;
            var y_dot = chart.y_origin + chart.dot_height_ratio * coordinates[i].y_pos;
            dotcontext.moveTo(x_dot - edge, y_dot);
            dotcontext.lineTo(x_dot + edge, y_dot);
            dotcontext.lineTo(x_dot, y_dot + edge);
            dotcontext.lineTo(x_dot - edge, y_dot);
            dotcontext.closePath();
            dotcontext.fillStyle = color;
            dotcontext.fill();
            dotcontext.strokeStyle = color;
            dotcontext.lineWidth = 1;
            dotcontext.stroke();
        }
    } else if (pattern == 2) {
        for (let i = 0; i < Statistics.count; i++) {
            dotcontext.beginPath();
            var edge = chart.dot_radius * width / 30;
            var x_dot = chart.x_origin + coordinates[i].x_pos;
            var y_dot = chart.y_origin + chart.dot_height_ratio * coordinates[i].y_pos;
            dotcontext.moveTo(x_dot - edge, y_dot - edge);
            dotcontext.lineTo(x_dot + edge, y_dot - edge);
            dotcontext.lineTo(x_dot + edge, y_dot + edge);
            dotcontext.lineTo(x_dot - edge, y_dot + edge);
            dotcontext.lineTo(x_dot - edge, y_dot - edge);
            dotcontext.closePath();
            dotcontext.fillStyle = color;
            dotcontext.fill();
            dotcontext.strokeStyle = color;
            dotcontext.lineWidth = 1;
            dotcontext.stroke();
        }
    }
    for (let i = 0; i < Statistics.count; i++) {
        let percent = (100 * Statistics.y_data[i] / sum_y).toFixed(0) + '%';
        dotcontext.fillStyle = 'black';
        chart.drawText(dotcontext, percent, chart.x_origin + coordinates[i].x_pos, chart.y_origin + chart.dot_height_ratio * coordinates[i].y_pos + 12);
    }
}

//根据当前Chart类对象chart的变量值，重新绘制整个图表(包括坐标轴)
//你会赞美这个函数的（）
function updateChart(chart) {
    //重绘坐标轴
    chart.resetScale();
    chart.clearCanvas(chart.canvas, chart.context);
    chart.drawAxis(chart.canvas, chart.context);
    chart.drawScale(chart.canvas, chart.context);
    chart.drawLabel(chart.canvas, chart.context);

    //更新统计图
    updateBarGraph(chart.canvas, chart.context, chart.barcanvas, chart.barcontext, chart.barcolor, chart.barflag);
    updateBrokenLineGraph(chart.canvas, chart.context, chart.linecanvas, chart.linecontext, chart.linecolor, chart.linepattern, chart.linewidth);
    updateBrokenDotGraph(chart.canvas, chart.context, chart.dotcanvas, chart.dotcontext, chart.dotcolor, chart.dotpattern, chart.dotwidth);
}

//初始化动态表格
function initDynamicTable() {
    let table_container = document.getElementsByClassName(table.table_container_class)[0];
    let threshold = 20;
    table.addRow(6);
    table_container.onmousemove = function() {
        if (table.table_lines_count > 200) {
            return;
        }
        if (table_container.scrollTop + table_container.clientHeight >= table_container.scrollHeight - threshold) {
            table.addRow(4);
        }
    };
}

//导入.csv文件至表格
function importTable(event) {
    let file = event.target.files[0];
    let reader = new FileReader();
    reader.onload = function(e) {
        table.clearTable();
        let contents = e.target.result;
        let rows = contents.split('\n').filter(str => str !== '');
        for (let i = 0; i < rows.length; i++) {
            let cells = rows[i].trim().split(',');
            table.addData(i + 1, cells[0], cells[1]);
        }
    };
    reader.readAsText(file);
}

//应用表格（表格数据的绘制）
function applyTable() {
    let _table = document.getElementById(table.table_id);
    let rows = _table.getElementsByTagName("tr");
    let x_data = [];
    let y_data = [];
    //从1开始，去除表头
    for (let i = 1; i < rows.length; i++) {
        let cells = rows[i].getElementsByTagName("td");
        let x = cells[0].innerText;
        let y = cells[1].innerText;
        if (x === "" || y === "" || isNaN(x) || isNaN(y)) {
            continue;
        }
        x_data.push(parseFloat(x));
        y_data.push(parseFloat(y));
    }
    Statistics.x_data = x_data;
    Statistics.y_data = y_data;
    Statistics.count = x_data.length;

    updateChart(chart);
}