using System;
using System.Text;
using System.Windows.Forms;

namespace xmessage
{
    class Program
    {
        static void Main(string[] args)
        {
            bool foundStringInput = false;
            StringBuilder msg = new StringBuilder();
            //Aggregate all string (the ones that start with single quote)
            foreach (var s in args)
            {
                if (s.StartsWith("'")) foundStringInput = true;
                if (foundStringInput)
                {
                   msg.Append(s);
                    msg.Append(" ");
                }
                if (s.EndsWith("'")) foundStringInput = false;
            }
            string message = msg.ToString().Trim().Replace("'","");
            //Define the options set (only print is used by policy manager and I don't care about the buttons)
          
            //Show the messagebox
            if (MessageBox.Show(message, "Webinos requires you permition to continue!",
                                                 MessageBoxButtons.YesNo, MessageBoxIcon.Question) == DialogResult.Yes)
                Console.Write("allow\n");
            else
                Console.Write("No? said Arthur grimly as he walked along beside him");//this could be anything besides allow :)
        }
    }
}
