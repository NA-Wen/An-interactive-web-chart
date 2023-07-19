'use strict';

//数据（二元数组）对象
const Statistics = {
    count: 0,           //变量对个数
    x_data: [],         //自变量数组
    y_data: [],         //因变量数组

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
    get _sum_y() {
        return this.y_data.reduce(function (a, b) {
            return a + b;
        }, 0);
    },
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
        bar_half_width, bar_color,
        dot_height_ratio, dot_radius) {

        //画布
        this.canvas_id = canvas_id;                     //HTML中canvas的id
        this.canvas = canvas;                           //画布
        this.context = context;                         //绘图上下文

        //坐标轴
        this.x_axis_width = x_axis_width;               //x轴线宽
        this.x_axis_color = x_axis_color;               //x轴颜色
        this.x_axis_length_ratio = x_axis_length_ratio; //x轴相对长度
        this.x_origin = x_origin;                       //原点x值
        this.y_axis_width = y_axis_width;               //y轴线宽
        this.y_axis_color = y_axis_color;               //y轴颜色
        this.y_axis_length_ratio = y_axis_length_ratio; //y轴相对长度
        this.y_origin = y_origin;                       //原点y值，（之前把i拼错为o结果整个图表都没了...）
        this.arrow_width = arrow_width;                 //箭头单面宽度，（以平放的箭头-->为准，横向为宽，纵向为高）
        this.arrow_height = arrow_height;               //箭头单面高度

        //刻度
        this.x_scale_begin = x_scale_begin;             //x轴刻度最小值
        this.x_scale_end = x_scale_end;                 //x轴刻度最大值
        this.x_scale_step = x_scale_step;               //x轴刻度跨度，（若值为3，则刻度为begin begin+3 begin+6...）
        this.x_scale_font = x_scale_font;               //x轴刻度字体样式
        this.x_scale_color = x_scale_color;             //x轴刻度颜色
        this.y_scale_begin = y_scale_begin;             //y轴刻度最小值
        this.y_scale_end = y_scale_end;                 //y轴刻度最大值
        this.y_scale_step = y_scale_step;               //y轴刻度跨度
        this.y_scale_font = y_scale_font;               //y轴刻度字体样式
        this.y_scale_color = y_scale_color;             //y轴刻度颜色

        //标签，标签内容存储可考虑改为string数组
        this.x_label_string = x_label_string;           //x轴标签字符串
        this.x_label_font = x_label_font;               //x轴标签字体样式
        this.x_label_color = x_label_color;             //x轴标签颜色
        this.y_label_string_1 = y_label_string_1;       //y轴标签字符串1
        this.y_label_string_2 = y_label_string_2;       //y轴标签字符串2

        this.y_label_font = y_label_font;               //y轴标签字体样式
        this.y_label_color = y_label_color;             //y轴标签颜色

        //条形统计图
        this.bar_half_width = bar_half_width;           //条的半宽度（！）
        this.bar_color = bar_color;                     //条的颜色

        //折线统计图
        this.dot_height_ratio = dot_height_ratio;       //点高度放大率（点在条上方，标示百分比，则高度增大相同倍数）
        this.dot_radius = dot_radius;                   //点半径

        //条形统计图和折线统计图的颜色、宽度、字号等样式暂时硬编码到对应函数里面了
        //可考虑添加:各类样式变量
    }

    //准备绘图工具
    initContext(canvas_id) {
        //初始化绘图上下文
        this.canvas = document.getElementById(canvas_id);
        this.context = this.canvas.getContext('2d');

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
    }

    //绘制文字（坐标轴变换后，若使用变换后的坐标轴，建议使用该函数绘制文字，避免上下颠倒，文字属性可在函数外的context中修改）
    drawText(context, text, x, y) {
        context.scale(1, -1);
        context.fillText(text, x, -y);
        context.scale(1, -1);
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
        let x_diatance = this.x_axis_length_ratio * canvas.width / (x_scale_array.length + 1);
        let x_A = (x_length - 2 * x_diatance) / (this.x_scale_end - this.x_scale_begin);
        let x_B = (x_diatance * (this.x_scale_end + this.x_scale_begin) - x_length * this.x_scale_begin) / (this.x_scale_end - this.x_scale_begin);
        let x_pos = x_A * x_data + x_B;

        //获取y坐标
        let y_length = this.y_axis_length_ratio * canvas.height;
        let y_scale_array = [];
        for (let i = this.y_scale_begin; i <= this.y_scale_end; i += this.y_scale_step) {
            y_scale_array.push(i);
        }
        let y_diatance = this.y_axis_length_ratio * canvas.width / (y_scale_array.length + 1);
        let y_A = (y_length - 2 * y_diatance) / (this.y_scale_end - this.y_scale_begin);
        let y_B = (y_diatance * (this.y_scale_end + this.y_scale_begin) - y_length * this.y_scale_begin) / (this.y_scale_end - this.y_scale_begin);
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
    drawBarGraph(canvas, context) {
        //获取坐标值
        let coordinates = [];
        for (let i = 0; i < Statistics.count; i++) {
            coordinates.push(this.getCoordinate(canvas, Statistics.x_data[i], Statistics.y_data[i]));
        }
        //绘制矩形及标签
        for (let i = 0; i < Statistics.count; i++) {
            context.fillStyle = this.bar_color;
            context.fillRect(this.x_origin + coordinates[i].x_pos - this.bar_half_width, this.y_origin, 2 * this.bar_half_width, coordinates[i].y_pos);
            context.fillStyle = 'black';
            this.drawText(context, Statistics.y_data[i].toString(), this.x_origin + coordinates[i].x_pos, this.y_origin + coordinates[i].y_pos + 8);
        }
        //其他设置和改进就交给后面各位了~
    }

    //绘制折线图
    drawBrokenLineGraph(canvas, context) {
        //获取坐标值
        let coordinates = [];
        for (let i = 0; i < Statistics.count; i++) {
            coordinates.push(this.getCoordinate(canvas, Statistics.x_data[i], Statistics.y_data[i]));
        }
        //绘制折线
        for (let i = 0; i < Statistics.count - 1; i++) {
            context.beginPath();
            context.moveTo(this.x_origin + coordinates[i].x_pos, this.y_origin + this.dot_height_ratio * coordinates[i].y_pos);
            context.lineTo(this.x_origin + coordinates[i + 1].x_pos, this.y_origin + this.dot_height_ratio * coordinates[i + 1].y_pos);
            context.strokeStyle = 'blue';
            context.stroke();
        }
        //绘制数据点及标签
        let sum_y = Statistics._sum_y;
        context.font = "12px Arial";
        for (let i = 0; i < Statistics.count; i++) {
            context.beginPath();
            context.arc(this.x_origin + coordinates[i].x_pos, this.y_origin + this.dot_height_ratio * coordinates[i].y_pos, this.dot_radius, 0, 2 * Math.PI, true);
            context.closePath();
            context.fillStyle = 'blue';
            context.fill();
            context.strokeStyle = 'red';
            context.lineWidth = 1;
            context.stroke();
            let percent = (100 * Statistics.y_data[i] / sum_y).toFixed(0) + '%';
            context.fillStyle = 'black';
            this.drawText(context, percent, this.x_origin + coordinates[i].x_pos, this.y_origin + this.dot_height_ratio * coordinates[i].y_pos + 12);
        }
    }

    //绘制图表，使一切画布内容重画
    drawChart() {
        //取得绘图上下文
        let canvas = this.canvas;
        let context = this.context;

        //清除当前绘制的内容
        this.clearCanvas(canvas, context);

        //调用函数绘制
        this.drawAxis(canvas, context);
        this.drawScale(canvas, context);
        this.drawLabel(canvas, context);
        this.drawBarGraph(canvas, context);
        this.drawBrokenLineGraph(canvas, context);
    }
}

//初始化Statistics对象
Statistics.count = 4;
Statistics.x_data = [2019, 2020, 2021, 2022];
Statistics.y_data = [2, 3, 5, 4];

//实例化Chart对象
var chart = new Chart;

//使用setter设置变量值
//画布id
chart.canvas_id = 'chart-canvas';

//坐标轴
chart.x_axis_width = 2;
chart.x_axis_color = 'blue';
chart.x_axis_length_ratio = 0.85;
chart.x_origin = 30;
chart.y_axis_width = 2;
chart.y_axis_color = 'blue';
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
chart.bar_color = 'green';

//折线统计图
chart.dot_height_ratio = 1.3;
chart.dot_radius = 4;

//绘制图表
chart.initContext(chart.canvas_id);
chart.drawChart();
