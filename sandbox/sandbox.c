#include <unistd.h>
#include <stdlib.h>
#include <stdio.h>
#include <fcntl.h>
#include <stdbool.h>
#include <sys/wait.h>
#include<string.h>

#define BUFFER_SIZE 4096
#define OUTPUT_BUFFER 1024
typedef unsigned char uchar;

void write_stdin_to_file(int *size)
{
    uchar buffer[BUFFER_SIZE];
    int read_bytes = 0;
    *size = 0;

    int fd = open("./binary", O_RDWR | O_CREAT, 0777);
    FILE *fp = fdopen(fd, "wb");

    if (fp == NULL)
    {
        fprintf(stdout, "Failed to open the file for writing\n");
        exit(-1);
    }

    while (true)
    {
        read_bytes = read(0, buffer, BUFFER_SIZE);
        if (read_bytes < 0)
        {
            fprintf(stdout, "Failed to read binary data, exiting");
            fclose(fp);
            exit(-1);
        }

        if (read_bytes == 0)
        {
            // EOF
            break;
        }

        // write data to the file
        *size += read_bytes;
        fwrite(buffer, sizeof(uchar), read_bytes, fp);
    }

    // wrote the file, close it.
    fclose(fp);
}

int compare_files(FILE *out, FILE *ans) {
    int ch1, ch2;  
    int line = 1;
    int col  = 0;
    
    rewind(out); // If we do not reset the pointer than we will get ?? symbols 
    rewind(ans); // imp to reset as garbage (EOF) will get matched --> AC

    while (1) {
        ch1 = fgetc(out);
        ch2 = fgetc(ans);
        
        if (ch1 == EOF && ch2 == EOF) {
            return 0;
        }
        if (ch1 == EOF || ch2 == EOF) {
            return 2000;
        }
 
        if (ch1 == '\n') {
            line += 1;
            col = 0;
        }


        if (ch1 != ch2) {
            return 2000;
        }

        col++;
    }
}

void sanitize_file(FILE *file){
    long write_pos = 0;
    long read_pos = 0;
    char line[10000];

    fseek(file, 0, SEEK_SET);

    while(fgets(line,sizeof(line),file) != NULL){
        read_pos = ftell(file);

        if(line[0] !='\n' && line[0] != '\r'){
            fseek(file,write_pos,SEEK_SET);
            fputs(line,file);
            write_pos = ftell(file);
            fseek(file,read_pos,SEEK_SET);
        }
    }
    if(line[strlen(line)-1] == '\n' || line[strlen(line)-1] == '\r') write_pos--;

    ftruncate(fileno(file), write_pos);
    fflush(file);
}


int main(int argc, char **argv)
{
    int size = 0, fread_bytes = 0;

    char output_buffer[OUTPUT_BUFFER];
    write_stdin_to_file(&size);

    if (size == 0)
    {
        fprintf(stdout, "Empty binary file, discarding\n");
        exit(0);
    }

    FILE *process_fd = popen("timeout 2s ./binary < ./testcase.txt", "r");
    if (process_fd == NULL)
    {
        fprintf(stdout, "Failed to execute the binary\n");
        exit(-1);
    }

    fprintf(stdout, "Executing binary inside the sandbox\n");

    FILE *outputFile = fopen("output.txt","w");
    // read the data as buffers and stream it to output.txt
    while (true) // SIGPIPE is been handled by reading from the pipe as buffers
    {
        fread_bytes = fread(output_buffer, sizeof(uchar), sizeof(uchar) * OUTPUT_BUFFER, process_fd);

        if (fread_bytes == 0)
        {
            // EOF
            break;
        }

        if (fread_bytes < 0)
        {
            // Error
            fprintf(stdout, "Failed to read the output");
            exit(-1);
        }

        output_buffer[fread_bytes] = '\0';

        fprintf(outputFile, "%s", output_buffer); // instead of stdout place it in a file and then compare the file with the answer.txt
    }

    fclose(outputFile);

    int termination_status = pclose(process_fd);
    // printf("%d",status);
    if (WIFEXITED(termination_status))
    {
        int exit_code = WEXITSTATUS(termination_status);
        // if exit_code is 0 check if the ouput.txt mathches with the answers for each testcases
        // return exit_code;
        if(exit_code == 0){
            FILE *out = fopen("output.txt","r+");
            FILE *ans = fopen("answer.txt","r+");
            if(ans == NULL){
                printf("FILES DO NOT EXITST");
                return -1;
            }
            sanitize_file(out);
            sanitize_file(ans);
            int res = compare_files(out,ans);
            fclose(out);
            fclose(ans);
            fprintf(stdout,"%d",res);
        }else{
            fprintf(stdout,"%d",exit_code); 
        }
    }
    else if (WIFSIGNALED(termination_status))
    {
        int signal_num = WTERMSIG(termination_status);
        fprintf(stdout,"%d",signal_num);
        // return signal_num;
    }
    else if (WCOREDUMP(termination_status))
    {
        fprintf(stdout,"%d",11);
        // return 11;
    }
    else if (WIFSTOPPED(termination_status))
    {
        int signal_num = WSTOPSIG(termination_status);
        fprintf(stdout,"%d",signal_num);
        // return signal_num;
    }
    getc(stdin);
    return 0;
}