#include <unistd.h>
#include <stdlib.h>
#include <stdio.h>
#include <fcntl.h>
#include <stdbool.h>
#include <sys/wait.h>

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

    int termination_status = pclose(process_fd);
    // printf("%d",status);
    if (WIFEXITED(termination_status))
    {
        int exit_code = WEXITSTATUS(termination_status);
        fprintf(stdout,"%d",exit_code); 
        // if exit_code is 0 check if the ouput.txt mathches with the answers for each testcases
        // return exit_code;
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