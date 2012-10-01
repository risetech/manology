namespace TextClassifierLib
{
	partial class FormMain
	{
		/// <summary>
		/// Required designer variable.
		/// </summary>
		private System.ComponentModel.IContainer components = null;

		/// <summary>
		/// Clean up any resources being used.
		/// </summary>
		/// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
		protected override void Dispose(bool disposing)
		{
			if (disposing && (components != null))
			{
				components.Dispose();
			}
			base.Dispose(disposing);
		}

		#region Windows Form Designer generated code

		/// <summary>
		/// Required method for Designer support - do not modify
		/// the contents of this method with the code editor.
		/// </summary>
		private void InitializeComponent()
		{
			this.tabControlMenu = new System.Windows.Forms.TabControl();
			this.tabPageLearn = new System.Windows.Forms.TabPage();
			this.dataGridViewGroups = new System.Windows.Forms.DataGridView();
			this.ColumnGroupName = new System.Windows.Forms.DataGridViewTextBoxColumn();
			this.ColumnGroupFilePath = new System.Windows.Forms.DataGridViewTextBoxColumn();
			this.ColumnChange = new System.Windows.Forms.DataGridViewButtonColumn();
			this.tableLayoutPanelMenu = new System.Windows.Forms.TableLayoutPanel();
			this.buttonImport = new System.Windows.Forms.Button();
			this.buttonExportToDataBase = new System.Windows.Forms.Button();
			this.buttonExportToFile = new System.Windows.Forms.Button();
			this.buttonLearn = new System.Windows.Forms.Button();
			this.buttonLoadLexicalizedWords = new System.Windows.Forms.Button();
			this.tabPageClassification = new System.Windows.Forms.TabPage();
			this.richTextBoxMainText = new System.Windows.Forms.RichTextBox();
			this.groupBoxWordCount = new System.Windows.Forms.GroupBox();
			this.textBox1 = new System.Windows.Forms.TextBox();
			this.buttonCheck = new System.Windows.Forms.Button();
			this.tabPageThemesWithWords = new System.Windows.Forms.TabPage();
			this.tabControlThemes = new System.Windows.Forms.TabControl();
			this.groupBoxThemeGroup = new System.Windows.Forms.GroupBox();
			this.comboBoxThemeGroup = new System.Windows.Forms.ComboBox();
			this.tabControlMenu.SuspendLayout();
			this.tabPageLearn.SuspendLayout();
			((System.ComponentModel.ISupportInitialize)(this.dataGridViewGroups)).BeginInit();
			this.tableLayoutPanelMenu.SuspendLayout();
			this.tabPageClassification.SuspendLayout();
			this.groupBoxWordCount.SuspendLayout();
			this.tabPageThemesWithWords.SuspendLayout();
			this.groupBoxThemeGroup.SuspendLayout();
			this.SuspendLayout();
			// 
			// tabControlMenu
			// 
			this.tabControlMenu.Controls.Add(this.tabPageLearn);
			this.tabControlMenu.Controls.Add(this.tabPageClassification);
			this.tabControlMenu.Controls.Add(this.tabPageThemesWithWords);
			this.tabControlMenu.Dock = System.Windows.Forms.DockStyle.Fill;
			this.tabControlMenu.Location = new System.Drawing.Point(0, 43);
			this.tabControlMenu.Name = "tabControlMenu";
			this.tabControlMenu.SelectedIndex = 0;
			this.tabControlMenu.Size = new System.Drawing.Size(926, 392);
			this.tabControlMenu.TabIndex = 0;
			// 
			// tabPageLearn
			// 
			this.tabPageLearn.Controls.Add(this.dataGridViewGroups);
			this.tabPageLearn.Controls.Add(this.tableLayoutPanelMenu);
			this.tabPageLearn.Location = new System.Drawing.Point(4, 22);
			this.tabPageLearn.Name = "tabPageLearn";
			this.tabPageLearn.Padding = new System.Windows.Forms.Padding(3);
			this.tabPageLearn.Size = new System.Drawing.Size(918, 366);
			this.tabPageLearn.TabIndex = 0;
			this.tabPageLearn.Text = "Обучение";
			this.tabPageLearn.UseVisualStyleBackColor = true;
			// 
			// dataGridViewGroups
			// 
			this.dataGridViewGroups.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.AutoSize;
			this.dataGridViewGroups.Columns.AddRange(new System.Windows.Forms.DataGridViewColumn[] {
            this.ColumnGroupName,
            this.ColumnGroupFilePath,
            this.ColumnChange});
			this.dataGridViewGroups.Dock = System.Windows.Forms.DockStyle.Fill;
			this.dataGridViewGroups.Location = new System.Drawing.Point(3, 3);
			this.dataGridViewGroups.Name = "dataGridViewGroups";
			this.dataGridViewGroups.Size = new System.Drawing.Size(912, 245);
			this.dataGridViewGroups.TabIndex = 1;
			this.dataGridViewGroups.CellContentClick += new System.Windows.Forms.DataGridViewCellEventHandler(this.dataGridViewGroups_CellContentClick);
			// 
			// ColumnGroupName
			// 
			this.ColumnGroupName.HeaderText = "Имя группы";
			this.ColumnGroupName.Name = "ColumnGroupName";
			this.ColumnGroupName.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.NotSortable;
			// 
			// ColumnGroupFilePath
			// 
			this.ColumnGroupFilePath.HeaderText = "Путь до файла";
			this.ColumnGroupFilePath.Name = "ColumnGroupFilePath";
			this.ColumnGroupFilePath.ReadOnly = true;
			this.ColumnGroupFilePath.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.NotSortable;
			// 
			// ColumnChange
			// 
			this.ColumnChange.HeaderText = "Изменить файл для обучения";
			this.ColumnChange.Name = "ColumnChange";
			this.ColumnChange.Text = "Изменить";
			this.ColumnChange.ToolTipText = "Изменить";
			// 
			// tableLayoutPanelMenu
			// 
			this.tableLayoutPanelMenu.ColumnCount = 5;
			this.tableLayoutPanelMenu.ColumnStyles.Add(new System.Windows.Forms.ColumnStyle(System.Windows.Forms.SizeType.Percent, 20F));
			this.tableLayoutPanelMenu.ColumnStyles.Add(new System.Windows.Forms.ColumnStyle(System.Windows.Forms.SizeType.Percent, 20F));
			this.tableLayoutPanelMenu.ColumnStyles.Add(new System.Windows.Forms.ColumnStyle(System.Windows.Forms.SizeType.Percent, 20F));
			this.tableLayoutPanelMenu.ColumnStyles.Add(new System.Windows.Forms.ColumnStyle(System.Windows.Forms.SizeType.Percent, 20F));
			this.tableLayoutPanelMenu.ColumnStyles.Add(new System.Windows.Forms.ColumnStyle(System.Windows.Forms.SizeType.Percent, 20F));
			this.tableLayoutPanelMenu.Controls.Add(this.buttonImport, 3, 0);
			this.tableLayoutPanelMenu.Controls.Add(this.buttonExportToDataBase, 2, 0);
			this.tableLayoutPanelMenu.Controls.Add(this.buttonExportToFile, 1, 0);
			this.tableLayoutPanelMenu.Controls.Add(this.buttonLearn, 0, 0);
			this.tableLayoutPanelMenu.Controls.Add(this.buttonLoadLexicalizedWords, 4, 0);
			this.tableLayoutPanelMenu.Dock = System.Windows.Forms.DockStyle.Bottom;
			this.tableLayoutPanelMenu.Location = new System.Drawing.Point(3, 248);
			this.tableLayoutPanelMenu.Name = "tableLayoutPanelMenu";
			this.tableLayoutPanelMenu.RowCount = 1;
			this.tableLayoutPanelMenu.RowStyles.Add(new System.Windows.Forms.RowStyle(System.Windows.Forms.SizeType.Percent, 100F));
			this.tableLayoutPanelMenu.Size = new System.Drawing.Size(912, 115);
			this.tableLayoutPanelMenu.TabIndex = 5;
			// 
			// buttonImport
			// 
			this.buttonImport.Dock = System.Windows.Forms.DockStyle.Fill;
			this.buttonImport.Location = new System.Drawing.Point(549, 3);
			this.buttonImport.Name = "buttonImport";
			this.buttonImport.Size = new System.Drawing.Size(176, 109);
			this.buttonImport.TabIndex = 3;
			this.buttonImport.Text = "Загрузить из файла";
			this.buttonImport.UseVisualStyleBackColor = true;
			this.buttonImport.Click += new System.EventHandler(this.buttonImport_Click);
			// 
			// buttonExportToDataBase
			// 
			this.buttonExportToDataBase.Dock = System.Windows.Forms.DockStyle.Fill;
			this.buttonExportToDataBase.Location = new System.Drawing.Point(367, 3);
			this.buttonExportToDataBase.Name = "buttonExportToDataBase";
			this.buttonExportToDataBase.Size = new System.Drawing.Size(176, 109);
			this.buttonExportToDataBase.TabIndex = 4;
			this.buttonExportToDataBase.Text = "Экспорт в базу";
			this.buttonExportToDataBase.UseVisualStyleBackColor = true;
			this.buttonExportToDataBase.Click += new System.EventHandler(this.buttonExportToDataBase_Click);
			// 
			// buttonExportToFile
			// 
			this.buttonExportToFile.Dock = System.Windows.Forms.DockStyle.Fill;
			this.buttonExportToFile.Location = new System.Drawing.Point(185, 3);
			this.buttonExportToFile.Name = "buttonExportToFile";
			this.buttonExportToFile.Size = new System.Drawing.Size(176, 109);
			this.buttonExportToFile.TabIndex = 2;
			this.buttonExportToFile.Text = "Экспорт в файл";
			this.buttonExportToFile.UseVisualStyleBackColor = true;
			this.buttonExportToFile.Click += new System.EventHandler(this.buttonExportToFile_Click);
			// 
			// buttonLearn
			// 
			this.buttonLearn.Dock = System.Windows.Forms.DockStyle.Fill;
			this.buttonLearn.Location = new System.Drawing.Point(3, 3);
			this.buttonLearn.Name = "buttonLearn";
			this.buttonLearn.Size = new System.Drawing.Size(176, 109);
			this.buttonLearn.TabIndex = 0;
			this.buttonLearn.Text = "Обучить";
			this.buttonLearn.UseVisualStyleBackColor = true;
			this.buttonLearn.Click += new System.EventHandler(this.buttonLearn_Click);
			// 
			// buttonLoadLexicalizedWords
			// 
			this.buttonLoadLexicalizedWords.Dock = System.Windows.Forms.DockStyle.Fill;
			this.buttonLoadLexicalizedWords.Location = new System.Drawing.Point(731, 3);
			this.buttonLoadLexicalizedWords.Name = "buttonLoadLexicalizedWords";
			this.buttonLoadLexicalizedWords.Size = new System.Drawing.Size(178, 109);
			this.buttonLoadLexicalizedWords.TabIndex = 5;
			this.buttonLoadLexicalizedWords.Text = "Загрузка словарных слов в базу";
			this.buttonLoadLexicalizedWords.UseVisualStyleBackColor = true;
			this.buttonLoadLexicalizedWords.Click += new System.EventHandler(this.buttonLoadLexicalizedWords_Click);
			// 
			// tabPageClassification
			// 
			this.tabPageClassification.Controls.Add(this.richTextBoxMainText);
			this.tabPageClassification.Controls.Add(this.groupBoxWordCount);
			this.tabPageClassification.Controls.Add(this.buttonCheck);
			this.tabPageClassification.Location = new System.Drawing.Point(4, 22);
			this.tabPageClassification.Name = "tabPageClassification";
			this.tabPageClassification.Padding = new System.Windows.Forms.Padding(3);
			this.tabPageClassification.Size = new System.Drawing.Size(918, 409);
			this.tabPageClassification.TabIndex = 1;
			this.tabPageClassification.Text = "Классификация";
			this.tabPageClassification.UseVisualStyleBackColor = true;
			// 
			// richTextBoxMainText
			// 
			this.richTextBoxMainText.Dock = System.Windows.Forms.DockStyle.Fill;
			this.richTextBoxMainText.Location = new System.Drawing.Point(3, 3);
			this.richTextBoxMainText.Name = "richTextBoxMainText";
			this.richTextBoxMainText.Size = new System.Drawing.Size(912, 252);
			this.richTextBoxMainText.TabIndex = 0;
			this.richTextBoxMainText.Text = "";
			this.richTextBoxMainText.TextChanged += new System.EventHandler(this.richTextBoxMainText_TextChanged);
			// 
			// groupBoxWordCount
			// 
			this.groupBoxWordCount.Controls.Add(this.textBox1);
			this.groupBoxWordCount.Dock = System.Windows.Forms.DockStyle.Bottom;
			this.groupBoxWordCount.Location = new System.Drawing.Point(3, 255);
			this.groupBoxWordCount.Name = "groupBoxWordCount";
			this.groupBoxWordCount.Size = new System.Drawing.Size(912, 43);
			this.groupBoxWordCount.TabIndex = 2;
			this.groupBoxWordCount.TabStop = false;
			this.groupBoxWordCount.Text = "Количество слов";
			// 
			// textBox1
			// 
			this.textBox1.Dock = System.Windows.Forms.DockStyle.Fill;
			this.textBox1.Location = new System.Drawing.Point(3, 16);
			this.textBox1.Name = "textBox1";
			this.textBox1.ReadOnly = true;
			this.textBox1.Size = new System.Drawing.Size(906, 20);
			this.textBox1.TabIndex = 0;
			this.textBox1.Text = "0";
			// 
			// buttonCheck
			// 
			this.buttonCheck.Dock = System.Windows.Forms.DockStyle.Bottom;
			this.buttonCheck.Location = new System.Drawing.Point(3, 298);
			this.buttonCheck.Name = "buttonCheck";
			this.buttonCheck.Size = new System.Drawing.Size(912, 108);
			this.buttonCheck.TabIndex = 1;
			this.buttonCheck.Text = "Классификация";
			this.buttonCheck.UseVisualStyleBackColor = true;
			this.buttonCheck.Click += new System.EventHandler(this.buttonCheck_Click);
			// 
			// tabPageThemesWithWords
			// 
			this.tabPageThemesWithWords.Controls.Add(this.tabControlThemes);
			this.tabPageThemesWithWords.Location = new System.Drawing.Point(4, 22);
			this.tabPageThemesWithWords.Name = "tabPageThemesWithWords";
			this.tabPageThemesWithWords.Padding = new System.Windows.Forms.Padding(3);
			this.tabPageThemesWithWords.Size = new System.Drawing.Size(918, 409);
			this.tabPageThemesWithWords.TabIndex = 2;
			this.tabPageThemesWithWords.Text = "Темы со словами";
			this.tabPageThemesWithWords.UseVisualStyleBackColor = true;
			// 
			// tabControlThemes
			// 
			this.tabControlThemes.Dock = System.Windows.Forms.DockStyle.Fill;
			this.tabControlThemes.Location = new System.Drawing.Point(3, 3);
			this.tabControlThemes.Name = "tabControlThemes";
			this.tabControlThemes.SelectedIndex = 0;
			this.tabControlThemes.Size = new System.Drawing.Size(912, 403);
			this.tabControlThemes.TabIndex = 0;
			// 
			// groupBoxThemeGroup
			// 
			this.groupBoxThemeGroup.Controls.Add(this.comboBoxThemeGroup);
			this.groupBoxThemeGroup.Dock = System.Windows.Forms.DockStyle.Top;
			this.groupBoxThemeGroup.Location = new System.Drawing.Point(0, 0);
			this.groupBoxThemeGroup.Name = "groupBoxThemeGroup";
			this.groupBoxThemeGroup.Size = new System.Drawing.Size(926, 43);
			this.groupBoxThemeGroup.TabIndex = 1;
			this.groupBoxThemeGroup.TabStop = false;
			this.groupBoxThemeGroup.Text = "Группа тем";
			// 
			// comboBoxThemeGroup
			// 
			this.comboBoxThemeGroup.Dock = System.Windows.Forms.DockStyle.Fill;
			this.comboBoxThemeGroup.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
			this.comboBoxThemeGroup.FormattingEnabled = true;
			this.comboBoxThemeGroup.Location = new System.Drawing.Point(3, 16);
			this.comboBoxThemeGroup.Name = "comboBoxThemeGroup";
			this.comboBoxThemeGroup.Size = new System.Drawing.Size(920, 21);
			this.comboBoxThemeGroup.TabIndex = 0;
			// 
			// FormMain
			// 
			this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
			this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
			this.ClientSize = new System.Drawing.Size(926, 435);
			this.Controls.Add(this.tabControlMenu);
			this.Controls.Add(this.groupBoxThemeGroup);
			this.Name = "FormMain";
			this.Text = "Классификатор аккаунтов";
			this.Load += new System.EventHandler(this.FormMain_Load);
			this.tabControlMenu.ResumeLayout(false);
			this.tabPageLearn.ResumeLayout(false);
			((System.ComponentModel.ISupportInitialize)(this.dataGridViewGroups)).EndInit();
			this.tableLayoutPanelMenu.ResumeLayout(false);
			this.tabPageClassification.ResumeLayout(false);
			this.groupBoxWordCount.ResumeLayout(false);
			this.groupBoxWordCount.PerformLayout();
			this.tabPageThemesWithWords.ResumeLayout(false);
			this.groupBoxThemeGroup.ResumeLayout(false);
			this.ResumeLayout(false);

		}

		#endregion

		private System.Windows.Forms.TabControl tabControlMenu;
		private System.Windows.Forms.TabPage tabPageLearn;
		private System.Windows.Forms.TabPage tabPageClassification;
		private System.Windows.Forms.Button buttonLearn;
		private System.Windows.Forms.DataGridView dataGridViewGroups;
		private System.Windows.Forms.DataGridViewTextBoxColumn ColumnGroupName;
		private System.Windows.Forms.DataGridViewTextBoxColumn ColumnGroupFilePath;
		private System.Windows.Forms.DataGridViewButtonColumn ColumnChange;
		private System.Windows.Forms.Button buttonCheck;
		private System.Windows.Forms.RichTextBox richTextBoxMainText;
		private System.Windows.Forms.Button buttonExportToFile;
		private System.Windows.Forms.Button buttonImport;
		private System.Windows.Forms.Button buttonExportToDataBase;
		private System.Windows.Forms.TableLayoutPanel tableLayoutPanelMenu;
		private System.Windows.Forms.Button buttonLoadLexicalizedWords;
		private System.Windows.Forms.TabPage tabPageThemesWithWords;
		private System.Windows.Forms.TabControl tabControlThemes;
		private System.Windows.Forms.GroupBox groupBoxWordCount;
		private System.Windows.Forms.TextBox textBox1;
		private System.Windows.Forms.GroupBox groupBoxThemeGroup;
		private System.Windows.Forms.ComboBox comboBoxThemeGroup;
	}
}

